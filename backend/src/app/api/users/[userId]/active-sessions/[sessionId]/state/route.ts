import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sessions, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { transformStateToClientFormat } from '@/app/api/users/[userId]/sessions/route';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; sessionId: string }> }
) {
  try {
    const { userId, sessionId } = await params;

    // Verify user exists
    const userRes = await db.select().from(users).where(eq(users.id, userId));
    if (userRes.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch session
    const sessionRes = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    const session = sessionRes[0];
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify user ownership
    if (session.userId !== userId) {
      return NextResponse.json({ error: 'Session does not belong to user' }, { status: 403 });
    }

    const flatState = JSON.parse(session.state);
    const clientState = transformStateToClientFormat(flatState);

    return NextResponse.json({
      user_id: userId,
      session_id: sessionId,
      state: clientState,
      create_time: session.createTime,
      update_time: session.updateTime,
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
