import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sessions } from '@/db/schema';

export async function DELETE() {
  try {
    const res = await db.delete(sessions);
    return NextResponse.json({
      deleted_count: res.changes, // SQLite returns changes count on better-sqlite3 run result
      message: 'Successfully deleted all sessions',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
