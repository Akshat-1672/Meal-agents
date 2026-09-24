import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    
    // Fetch the session
    const currentSession = await sessionService.getSession(sessionId);
    
    if (!currentSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Soft delete: Update the state with is_deleted flag
    const updatedState = {
      ...(currentSession.state || {}),
      is_deleted: true
    };

    await sessionService.updateSession(sessionId, updatedState);

    return NextResponse.json({ success: true, message: 'Session deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete session' }, { status: 500 });
  }
}
