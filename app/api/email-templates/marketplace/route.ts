import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { email_templates, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const templates = await db
    .select({
      id: email_templates.id,
      html: email_templates.html,
      prompt: email_templates.prompt,
      name: email_templates.name,
      first_name: users.first_name,
      last_name: users.last_name,
    })
    .from(email_templates)
    .where(eq(email_templates.is_public, true))
    .innerJoin(users, eq(email_templates.user_id, users.clerk_id));
  return NextResponse.json(templates);
} 