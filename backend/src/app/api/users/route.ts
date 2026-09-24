import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const list = await db.select().from(users);
    const parsed = list.map(u => ({
      id: u.id,
      name: u.name,
      preferences: JSON.parse(u.preferences || '[]'),
      allergies: JSON.parse(u.allergies || '[]'),
      days: JSON.parse(u.days || '[]'),
      meals: JSON.parse(u.meals || '[]'),
      special_instructions: u.specialInstructions
    }));
    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, preferences, allergies, days, meals, special_instructions } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'Missing id or name' }, { status: 400 });
    }

    const payload = {
      id,
      name,
      preferences: JSON.stringify(preferences || []),
      allergies: JSON.stringify(allergies || []),
      days: JSON.stringify(days || []),
      meals: JSON.stringify(meals || []),
      specialInstructions: special_instructions || ''
    };

    const existing = await db.select().from(users).where(eq(users.id, id));
    if (existing.length > 0) {
      await db.update(users).set(payload).where(eq(users.id, id));
    } else {
      await db.insert(users).values(payload);
    }

    return NextResponse.json({
      id,
      name,
      preferences: preferences || [],
      allergies: allergies || [],
      days: days || [],
      meals: meals || [],
      special_instructions: special_instructions || ''
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
