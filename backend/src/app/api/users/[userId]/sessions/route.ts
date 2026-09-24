import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sessions, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export function transformStateToClientFormat(flatState: Record<string, any>): Record<string, any> {
  const clientState: Record<string, any> = {
    is_deleted: flatState.is_deleted || false,
    user: {},
    workflow_status: flatState.workflow_status || 'IDLE',
    planning: {},
    verification: {},
    ordering: {
      order_status: {},
      confirmation: {
        bill: {}
      }
    }
  };

  for (const [key, value] of Object.entries(flatState)) {
    if (key.startsWith('user_')) {
      const attr = key.replace('user_', '');
      clientState.user[attr] = value;
    } else if (key.startsWith('planning_')) {
      const attr = key.replace('planning_', '');
      clientState.planning[attr] = value;
    } else if (key.startsWith('verification_')) {
      const attr = key.replace('verification_', '');
      clientState.verification[attr] = value;
    } else if (key.startsWith('ordering_order_status_')) {
      const attr = key.replace('ordering_order_status_', '');
      clientState.ordering.order_status[attr] = value;
    } else if (key.startsWith('ordering_confirmation_bill_')) {
      const attr = key.replace('ordering_confirmation_bill_', '');
      clientState.ordering.confirmation.bill[attr] = value;
    } else if (key.startsWith('ordering_confirmation_')) {
      const attr = key.replace('ordering_confirmation_', '');
      clientState.ordering.confirmation[attr] = value;
    } else if (key.startsWith('ordering_')) {
      const attr = key.replace('ordering_', '');
      clientState.ordering[attr] = value;
    }
  }

  return clientState;
}

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

    const formattedSessions = sessionList.map(s => {
      const flatState = JSON.parse(s.state);
      return {
        session_id: s.id,
        state: transformStateToClientFormat(flatState),
        create_time: s.createTime,
        update_time: s.updateTime
      };
    }).filter(s => !s.state.is_deleted);

    return NextResponse.json({
      user_id: userId,
      sessions_count: sessionList.length,
      sessions: formattedSessions,
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
