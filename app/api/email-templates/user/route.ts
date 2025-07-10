import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { email_templates } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get('user_id');
  if (!user_id) {
    return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
  }
  const templates = await db.select().from(email_templates).where(eq(email_templates.user_id, user_id));
  return NextResponse.json(templates);
} 