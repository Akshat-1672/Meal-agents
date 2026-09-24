import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sessions, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Verify user exists
    const userRes = await db.select().from(users).where(eq(users.id, userId));
    if (userRes.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const sessionList = await db.select().from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(desc(sessions.updateTime));

    const activeSessionIds: string[] = [];

    for (const s of sessionList) {
      const flatState = JSON.parse(s.state);
      const status = flatState.workflow_status || '';
      if (status !== 'ORDER_CONFIRMED' && status !== 'NO_PLANNING_NEEDED') {
        activeSessionIds.push(s.id);
      }
    }

    return NextResponse.json({
      user_id: userId,
      active_sessions_count: activeSessionIds.length,
      session_ids: activeSessionIds,
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
