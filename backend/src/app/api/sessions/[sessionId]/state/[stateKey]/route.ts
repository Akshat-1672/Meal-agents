import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string; stateKey: string }> }
) {
  try {
    const { sessionId, stateKey } = await params;

    const sessionRes = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    const session = sessionRes[0];
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const flatState = JSON.parse(session.state);
    const value = flatState[stateKey];

    if (value === undefined) {
      return NextResponse.json({ error: `State key '${stateKey}' not found` }, { status: 404 });
    }

    return NextResponse.json({
      session_id: sessionId,
      state_key: stateKey,
      value,
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
