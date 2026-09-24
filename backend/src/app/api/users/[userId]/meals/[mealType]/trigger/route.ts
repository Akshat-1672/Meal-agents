import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { db } from '@/db';
import { users, sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { AgentRunner } from '@/agents/runner';
import { rootAgent } from '@/agents/definitions';
import { MOCK_VERIFICATION_CHOICES } from '@/utils/mockData';
import crypto from 'crypto';

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
  { params }: { params: Promise<{ userId: string; mealType: string }> }
) {
  try {
    const { userId, mealType } = await params;
    const searchParams = req.nextUrl.searchParams;
    const streaming = searchParams.get('streaming') === 'true';
    const mockDay = searchParams.get('mock_day') || '';

    // 1. Fetch user profile from DB
    const userRes = await db.select().from(users).where(eq(users.id, userId));
    const user = userRes[0];
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse JSON properties
    const userPrefs = JSON.parse(user.preferences || '[]');
    const userAllergies = JSON.parse(user.allergies || '[]');
    const userDays = JSON.parse(user.days || '[]');
    const userMeals = JSON.parse(user.meals || '[]');

    const sessionId = crypto.randomUUID();
    const initialState = {
      workflow_status: 'IDLE',
      planning_meal_type: mealType,
      planning_options: [],
      planning_modalities: [],
      user_id: user.id,
      user_name: user.name,
      user_days: userDays.join(','),
      user_meals: userMeals.map((m: any) => `${m.type}${m.customName ? ':' + m.customName : ''}`).join(','),
      user_dietary_preferences: userPrefs.join(','),
      user_allergies: userAllergies,
      user_special_instructions: user.specialInstructions || '',
      mock_day: mockDay,
      // Swiggy MCP auth token (static mock token, replace with real OAuth token in production)
      swiggy_token: process.env.SWIGGY_MOCK_TOKEN || 'mock-swiggy-token-dev',
      // User coordinates for location-based MCP tools (from query params, defaults to Bangalore)
      user_lat: parseFloat(searchParams.get('lat') || '12.9716'),
      user_lng: parseFloat(searchParams.get('lng') || '77.5946'),
      verification_user_feedback: '',
      verification_user_choice: [],
      verification_message: '',
      verification_choices: [],
      ordering_order_status_id: '',
      ordering_order_status_restaurant_id: '',
      ordering_order_status_status: '',
      ordering_order_status_order: {},
      ordering_confirmation_message: '',
      ordering_confirmation_bill_restaurant_name: '',
      ordering_confirmation_bill_items: [],
      ordering_confirmation_bill_total_amount: ''
    };

    // 2. Persist session creation
    const now = new Date().toISOString();
    await db.insert(sessions).values({
      appName: 'auto_nom_agent',
      userId: user.id,
      id: sessionId,
      state: JSON.stringify(initialState),
      createTime: now,
      updateTime: now,
    });

    const userQuery = `Plan a ${mealType} for ${user.name}`;
    const runner = new AgentRunner(ai, rootAgent, sessionService);

    // States where we must pause and wait for the user to input something
    const USER_PAUSE_STATES = new Set([
      'AWAITING_USER_APPROVAL',
      'ORDER_CONFIRMED',
      'MEAL_PLANNING_FAILED',
      'ERROR',
    ]);

    // Helper: run agents in a chain until a pause or terminal state
    async function* runAgentChain(userQuery: string) {
      let currentQuery = userQuery;
      let chainStep = 0;
      const maxChainSteps = 5; // Safety limit

      while (chainStep < maxChainSteps) {
        chainStep++;
        let lastStatus = '';

        for await (const chunk of runner.runAsync(userId, sessionId, currentQuery)) {
          if (chunk?.workflow_status) {
            lastStatus = chunk.workflow_status;
          }
          yield chunk;
        }

        // After each agent run, check if we should continue chaining
        const session = await sessionService.getSession(sessionId);
        const currentStatus = session?.state?.workflow_status || lastStatus;

        console.log(`[AgentChain] Step ${chainStep}: status=${currentStatus}`);

        if (USER_PAUSE_STATES.has(currentStatus)) {
          // Reached a pause or terminal state — stop the chain
          break;
        }

        // Continue chaining with a handoff message
        currentQuery = `Continue from status: ${currentStatus}`;
      }
    }

    if (!streaming) {
      // Fire and forget background task
      (async () => {
        try {
          for await (const _ of runAgentChain(userQuery)) { /* drain */ }
        } catch (e: any) {
          console.error('[Agent Trigger Error]:', e);
          
          let friendlyError = e.message || 'An unexpected error occurred during meal planning';
          let isRateLimit = false;
          try {
            if (friendlyError.includes('{"error"')) {
              const jsonStr = friendlyError.substring(friendlyError.indexOf('{"error"'));
              const parsed = JSON.parse(jsonStr);
              if (parsed.error && parsed.error.message) {
                friendlyError = parsed.error.message;
                // If it's a quota error, make it even friendlier
                if (parsed.error.code === 429) {
                  friendlyError = "AI Rate Limit Exceeded: " + friendlyError.split('.')[0] + ". Please wait a moment and try again.";
                  isRateLimit = true;
                }
              }
            }
          } catch (parseErr) { /* ignore */ }

          if (isRateLimit) {
            console.log('[Agent Trigger] Rate limit hit. Using mock fallback to bypass error.');
            try {
              const session = await sessionService.getSession(sessionId);
              if (session && session.state) {
                const mockState = {
                  ...session.state,
                  workflow_status: 'AWAITING_USER_APPROVAL',
                  verification_message: "⚠️ **AI Rate Limit Exceeded (Mock Fallback)**\n\nI hit my rate limit and couldn't generate real options, but I injected this mock payload so you can test the UI flow! Please select an option below.",
                  verification_choices: MOCK_VERIFICATION_CHOICES
                };
                await sessionService.updateSession(sessionId, mockState);
                return; // Return early, do not set ERROR
              }
            } catch (dbErr) {
              console.error('[Agent Trigger Error] Failed to update session status for mock fallback:', dbErr);
            }
          }

          try {
            const session = await sessionService.getSession(sessionId);
            if (session && session.state) {
              const updatedState = { 
                ...session.state, 
                workflow_status: 'ERROR',
                error_message: friendlyError
              };
              await sessionService.updateSession(sessionId, updatedState);
            }
          } catch (dbErr) {
            console.error('[Agent Trigger Error] Failed to update session status to ERROR:', dbErr);
          }
        }
      })();

      return NextResponse.json({
        session_id: sessionId,
        workflow_status: 'STARTED',
        user_id: userId,
        meal_type: mealType,
        timestamp: now,
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
          console.error('[Agent Stream Trigger Error]:', err);
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
