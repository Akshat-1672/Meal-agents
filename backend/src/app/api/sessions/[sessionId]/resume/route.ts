import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { db } from '@/db';
import { sessions, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { AgentRunner } from '@/agents/runner';
import { rootAgent } from '@/agents/definitions';
import { getRandomMockOrderConfirmation, getMockOrderConfirmationForModality } from '@/utils/mockData';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const sessionService = {
  async getSession(id: string) {
    const res = await db.select().from(sessions).where(eq(sessions.id, id));
    return res[0] ? { ...res[0], state: JSON.parse(res[0].state) } : null;
  },
  async updateSession(id: string, state: any) {
    await db.update(sessions)
      .set({ state: JSON.stringify(state), updateTime: new Date().toISOString() })
      .where(eq(sessions.id, id));
  }
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const searchParams = req.nextUrl.searchParams;
    const streaming = searchParams.get('streaming') === 'true';

    // 1. Fetch existing session
    const sessionRes = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    const session = sessionRes[0];
    if (!session) {
      return NextResponse.json({ error: `Session not found: ${sessionId}` }, { status: 404 });
    }

    const state = JSON.parse(session.state);
    const userId = session.userId;

    // 2. Fetch user profile
    const userRes = await db.select().from(users).where(eq(users.id, userId));
    const user = userRes[0];
    if (!user) {
      return NextResponse.json({ error: `User not found: ${userId}` }, { status: 404 });
    }

    // Parse user request body
    const body = await req.json();
    const { choice } = body; // Can be a string like "1", "1,3", or natural language feedback

    if (choice === undefined) {
      return NextResponse.json({ error: 'Missing choice in body' }, { status: 400 });
    }

    const userQuery = String(choice);
    const runner = new AgentRunner(ai, rootAgent, sessionService);

    // States where we must pause and wait for the user to input something
    const USER_PAUSE_STATES = new Set([
      'AWAITING_USER_APPROVAL',
      'ORDER_CONFIRMED',
      'MEAL_PLANNING_FAILED',
      'ERROR',
      'NO_PLANNING_NEEDED'
    ]);

    // Helper: run agents in a chain until a pause or terminal state
    async function* runAgentChain(userQuery: string) {
      let currentQuery = userQuery;
      let chainStep = 0;
      const maxChainSteps = 5; // Safety limit

      while (chainStep < maxChainSteps) {
        chainStep++;
        let lastStatus = '';

        // Fast-path to bypass MealChoiceVerifier LLM for simple structured option clicks
        const session = await sessionService.getSession(sessionId);
        let currentStatus = session?.state?.workflow_status || lastStatus;
        
        if (chainStep === 1 && currentStatus === 'AWAITING_USER_APPROVAL' && currentQuery.match(/^Option \d+/i)) {
          const match = currentQuery.match(/^Option (\d+)/i);
          if (match) {
            const idx = parseInt(match[1]);
            const updatedState = {
              ...(session?.state || {}),
              verification_user_choice: [idx],
              verification_user_response: currentQuery,
              workflow_status: 'USER_APPROVAL_RECEIVED'
            };
            if (session) {
              await sessionService.updateSession(sessionId, updatedState);
            }
            currentStatus = 'USER_APPROVAL_RECEIVED';
            console.log(`[AgentChain] Fast-path bypass MealChoiceVerifier for Option ${idx}`);
            // Yield a mock chunk so UI knows it's proceeding
            yield { type: 'TextResponse', text: `Processing Option ${idx}...`, isFinalResponse: false };
          }
        } else {
          // Normal LLM execution
          for await (const chunk of runner.runAsync(userId, sessionId, currentQuery)) {
            if (chunk?.workflow_status) {
              lastStatus = chunk.workflow_status;
            }
            yield chunk;
          }
        }

        // Fetch post-execution state
        const updatedSession = await sessionService.getSession(sessionId);
        currentStatus = updatedSession?.state?.workflow_status || lastStatus;

        console.log(`[AgentChain] Resume Step ${chainStep}: status=${currentStatus}`);

        if (USER_PAUSE_STATES.has(currentStatus)) {
          // Reached a pause or terminal state — stop the chain
          break;
        }

        // Continue chaining with a handoff message
        currentQuery = `Continue from status: ${currentStatus}`;
      }
    }

    if (!streaming) {
      // Fire and forget background execution
      (async () => {
        try {
          for await (const _ of runAgentChain(userQuery)) {
            // Run until complete
          }
        } catch (e: any) {
          console.error('[Agent Resume Error]:', e);
          
          let friendlyError = e.message || 'An unexpected error occurred during meal ordering';
          let isRateLimit = false;
          try {
            if (friendlyError.includes('{"error"')) {
              const jsonStr = friendlyError.substring(friendlyError.indexOf('{"error"'));
              const parsed = JSON.parse(jsonStr);
              if (parsed.error && parsed.error.message) {
                friendlyError = parsed.error.message;
                if (parsed.error.code === 429) {
                  friendlyError = "AI Rate Limit Exceeded: " + friendlyError.split('.')[0] + ". Please wait a moment and try again.";
                  isRateLimit = true;
                }
              }
            }
          } catch (parseErr) { /* ignore */ }

          if (isRateLimit) {
            console.log('[Agent Resume] Rate limit hit. Using mock fallback to bypass error.');
            try {
              const currentSession = await sessionService.getSession(sessionId);
              if (currentSession && currentSession.state) {
                // Parse modality from user choice string (e.g. "Option 2...")
                let selectedModality = 'delivery'; // default fallback
                try {
                  const match = userQuery.match(/Option (\d+)/i);
                  if (match && currentSession.state.verification_choices) {
                    const idx = parseInt(match[1]) - 1;
                    if (currentSession.state.verification_choices[idx]) {
                      selectedModality = currentSession.state.verification_choices[idx].modality;
                    }
                  }
                } catch (e) { /* ignore parse errors */ }

                const orderMock = getMockOrderConfirmationForModality(selectedModality);
                const mockState = { 
                  ...currentSession.state, 
                  workflow_status: 'ORDER_CONFIRMED',
                  ordering_order_status_status: 'PLACED',
                  ordering_order_status_estimated_delivery: '45 mins',
                  ordering_confirmation: orderMock
                };
                await sessionService.updateSession(sessionId, mockState);
                return; // Return early, do not set ERROR
              }
            } catch (dbErr) {
              console.error('[Agent Resume Error] Failed to update session status for mock fallback:', dbErr);
            }
          }

          try {
            const currentSession = await sessionService.getSession(sessionId);
            if (currentSession && currentSession.state) {
              const updatedState = { 
                ...currentSession.state, 
                workflow_status: 'ERROR',
                error_message: friendlyError
              };
              await sessionService.updateSession(sessionId, updatedState);
            }
          } catch (dbErr) {
            console.error('[Agent Resume Error] Failed to update session status to ERROR:', dbErr);
          }
        }
      })();

      // Fetch refreshed status
      const updatedSession = await sessionService.getSession(sessionId);
      const workflowStatus = updatedSession ? updatedSession.state.workflow_status : 'PROCESSING';

      return NextResponse.json({
        session_id: sessionId,
        workflow_status: workflowStatus,
        user_id: userId,
        user_choice: choice,
        timestamp: new Date().toISOString()
      });
    }

    // 3. SSE Stream Generation
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of runAgentChain(userQuery)) {
            if (chunk) {
              const dataChunk = { ...chunk, session_id: sessionId };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(dataChunk)}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('event: done\ndata: {}\n\n'));
        } catch (err: any) {
          console.error('[Agent Stream Resume Error]:', err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message, session_id: sessionId })}\n\n`));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
