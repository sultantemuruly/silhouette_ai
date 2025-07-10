import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { email_templates, users } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const offset = (page - 1) * limit;

  // Get total count of public templates
  const [{ count }] = await db
    .select({ count: sql`count(*)::int` })
    .from(email_templates)
    .where(eq(email_templates.is_public, true));

  // Get paginated templates
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
    .innerJoin(users, eq(email_templates.user_id, users.clerk_id))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ templates, total: count });
} 