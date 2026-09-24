import { GoogleGenAI, Content } from '@google/genai';
import { LlmAgent, SessionState, AgentContext } from './types';

export class AgentRunner {
  private ai: GoogleGenAI;
  private rootAgent: LlmAgent;
  private sessionService: {
    getSession: (id: string) => Promise<any>;
    updateSession: (id: string, state: any) => Promise<void>;
  };

  constructor(ai: GoogleGenAI, rootAgent: LlmAgent, sessionService: any) {
    this.ai = ai;
    this.rootAgent = rootAgent;
    this.sessionService = sessionService;
  }

  public async *runAsync(
    userId: string,
    sessionId: string,
    userMessage: string,
    history: Content[] = []
  ): AsyncGenerator<any, void, unknown> {

    // 1. Fetch current state from DB
    const session = await this.sessionService.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    const state: SessionState = session.state;

    // A list of items to stream back to the SSE handler
    const yieldedChunks: any[] = [];
    const context: AgentContext = {
      state,
      ai: this.ai,
      logEvent: (evt) => {
        yieldedChunks.push(evt);
      },
    };

    // 2. Select appropriate active agent based on workflow status
    let activeAgent = this.determineActiveAgent(state);
    console.log(`[AgentRunner] Running active agent: ${activeAgent.name} (Status: ${state.workflow_status})`);

    // 3. Pre-agent execution hook
    if (activeAgent.beforeCall) {
      activeAgent.beforeCall(context);
      // If state changed, we re-evaluate the active agent
      activeAgent = this.determineActiveAgent(state);
    }

    // 4. Build prompt incorporating current context
    const instructions = activeAgent.instruction(state);
    const systemInstruction = instructions;

    // Combine current history & user prompt
    const contents: Content[] = [
      ...history,
      { role: 'user', parts: [{ text: userMessage }] }
    ];

    // Setup Tools
    const toolsMap = new Map<string, any>();
    const declarations: any[] = [];

    if (activeAgent.tools) {
      for (const t of activeAgent.tools) {
        declarations.push(t.declaration);
        toolsMap.set(t.declaration.name!, t.execute);
      }
    }

    // Include subagent delegation tools if subagents exist
    if (activeAgent.subAgents) {
      for (const sub of activeAgent.subAgents) {
        const subDecl = {
          name: `delegate_to_${sub.name}`,
          description: `Delegate task or context to subagent ${sub.name}: ${sub.description}`,
          parameters: {
            type: 'OBJECT',
            properties: {
              taskDescription: { type: 'STRING', description: "Description of the task to delegate" }
            },
            required: ["taskDescription"]
          }
        };
        declarations.push(subDecl);
        toolsMap.set(subDecl.name, async (args: any, ctx: AgentContext) => {
          ctx.logEvent({ type: 'TextResponse', text: `💭 *Delegating control to ${sub.name}...*`, isFinalResponse: false });
          return await this.executeSubAgent(sub, args.taskDescription, ctx);
        });
      }
    }

    // Execute generation loop (handles Tool Request/Response loop)
    let finished = false;
    let turnCount = 0;
    const maxTurns = 8; // Prevent infinite loops

    while (!finished && turnCount < maxTurns) {
      turnCount++;

      // Flush any events that tool calls or hooks wrote to yieldedChunks
      while (yieldedChunks.length > 0) {
        yield yieldedChunks.shift();
      }

      const response = await this.ai.models.generateContent({
        model: 'gemma-4-26b-a4b-it',
        contents,
        config: {
          systemInstruction,
          tools: declarations.length > 0 ? [{ functionDeclarations: declarations }] : undefined,
        }
      });

      // Track assistant message in session history
      const candidate = response.candidates?.[0];
      if (candidate?.content) {
        contents.push(candidate.content);

        // Stream text chunk if available
        if (candidate.content.parts?.[0]?.text) {
          yield {
            type: 'TextResponse',
            text: candidate.content.parts[0].text,
            isFinalResponse: !response.functionCalls || response.functionCalls.length === 0
          };
        }
      }

      // Check for function/tool calls
      const calls = response.functionCalls;
      if (calls && calls.length > 0) {
        const functionResponses: any[] = [];

        for (const call of calls) {
          yield {
            type: 'ToolCall',
            calls: [{ name: call.name, arguments: call.args }]
          };

          const toolFn = call.name ? toolsMap.get(call.name) : undefined;
          let result;
          if (toolFn) {
            try {
              result = await toolFn(call.args, context);
            } catch (err: any) {
              result = { status: 'error', error: err.message };
            }
          } else {
            result = { status: 'error', error: `Tool ${call.name} not found` };
          }

          yield {
            type: 'ToolResponse',
            responses: [{ name: call.name, response: result }]
          };

          functionResponses.push({
            name: call.name,
            response: result
          });
        }

        // Send function responses back to Gemini
        contents.push({
          role: 'user',
          parts: functionResponses.map(r => ({
            functionResponse: { name: r.name, response: r.response }
          }))
        });

      } else {
        // No more tool calls, turn is done
        finished = true;
      }
    }

    // 5. Post-agent execution hook
    if (activeAgent.afterCall) {
      activeAgent.afterCall(context);
    }

    // Flush remaining yielded logs
    while (yieldedChunks.length > 0) {
      yield yieldedChunks.shift();
    }

    // 6. Persist updated state to DB
    await this.sessionService.updateSession(sessionId, context.state);

    yield {
      type: 'TextResponse',
      isFinalResponse: true,
      workflow_status: context.state.workflow_status
    };
  }

  private determineActiveAgent(state: SessionState): LlmAgent {
    const status = state.workflow_status;
    if (status === 'IDLE' || status === 'MEAL_PLANNING_STARTED' || status === 'USER_REJECTION_RECEIVED') {
      return this.rootAgent.subAgents?.find(a => a.name === 'MealPlanner') || this.rootAgent;
    }
    if (status === 'MEAL_PLANNING_COMPLETE' || status === 'AWAITING_USER_APPROVAL') {
      return this.rootAgent.subAgents?.find(a => a.name === 'MealChoiceVerifier') || this.rootAgent;
    }
    if (status === 'USER_APPROVAL_RECEIVED' || status === 'PLACING_ORDER') {
      return this.rootAgent.subAgents?.find(a => a.name === 'MealOrderExecutor') || this.rootAgent;
    }
    return this.rootAgent;
  }

  private async executeSubAgent(subAgent: LlmAgent, subPrompt: string, parentContext: AgentContext): Promise<any> {
    if (subAgent.beforeCall) subAgent.beforeCall(parentContext);

    const instructions = subAgent.instruction(parentContext.state);

    // Configure tools if subagent has any
    const declarations: any[] = [];
    const toolsMap = new Map<string, any>();
    if (subAgent.tools) {
      for (const t of subAgent.tools) {
        declarations.push(t.declaration);
        toolsMap.set(t.declaration.name!, t.execute);
      }
    }

    let finished = false;
    let turnCount = 0;
    const contents: Content[] = [{ role: 'user', parts: [{ text: subPrompt }] }];
    let lastResult: any = null;

    while (!finished && turnCount < 5) {
      turnCount++;
      const response = await this.ai.models.generateContent({
        model: 'gemma-4-26b-a4b-it',
        contents,
        config: {
          systemInstruction: instructions,
          tools: declarations.length > 0 ? [{ functionDeclarations: declarations }] : undefined,
        }
      });

      const candidate = response.candidates?.[0];
      if (candidate?.content) {
        contents.push(candidate.content);
        if (candidate.content.parts?.[0]?.text) {
          lastResult = candidate.content.parts[0].text;
        }
      }

      const calls = response.functionCalls;
      if (calls && calls.length > 0) {
        const functionResponses: any[] = [];
        for (const call of calls) {
          const toolFn = call.name ? toolsMap.get(call.name) : undefined;
          let result;
          if (toolFn) {
            try {
              result = await toolFn(call.args, parentContext);
            } catch (err: any) {
              result = { status: 'error', error: err.message };
            }
          } else {
            result = { status: 'error', error: `Tool ${call.name} not found` };
          }
          functionResponses.push({
            name: call.name,
            response: result
          });
        }
        contents.push({
          role: 'user',
          parts: functionResponses.map(r => ({
            functionResponse: { name: r.name, response: r.response }
          }))
        });
      } else {
        finished = true;
      }
    }

    if (subAgent.afterCall) subAgent.afterCall(parentContext);

    return {
      status: 'success',
      agent: subAgent.name,
      response: lastResult || 'Completed task.'
    };
  }
}
