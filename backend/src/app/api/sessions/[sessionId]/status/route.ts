import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { db } from '@/db';
import { sessions, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { AgentRunner } from '@/agents/runner';
import { rootAgent } from '@/agents/definitions';

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

    // Try reading optional message from request body
    let message = 'What is the current status of my order?';
    try {
      const body = await req.json();
      if (body && body.message) {
        message = body.message;
      }
    } catch (e) {
      // Body not provided or not JSON
    }

    const userQuery = message;
    const runner = new AgentRunner(ai, rootAgent, sessionService);

    if (!streaming) {
      // Fire and forget background execution
      (async () => {
        try {
          for await (const _ of runner.runAsync(userId, sessionId, userQuery)) {
            // Run until complete
          }
        } catch (e) {
          console.error('[Agent Status Check Error]:', e);
        }
      })();

      const updatedSession = await sessionService.getSession(sessionId);
      const workflowStatus = updatedSession ? updatedSession.state.workflow_status : 'CHECKING_STATUS';

      return NextResponse.json({
        session_id: sessionId,
        workflow_status: workflowStatus,
        user_id: userId,
        action: 'status_check',
        message: userQuery,
        timestamp: new Date().toISOString()
      });
    }

    // 3. SSE Stream Generation
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of runner.runAsync(userId, sessionId, userQuery)) {
            if (chunk) {
              const dataChunk = { ...chunk, session_id: sessionId };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(dataChunk)}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('event: done\ndata: {}\n\n'));
        } catch (err: any) {
          console.error('[Agent Stream Status Check Error]:', err);
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
