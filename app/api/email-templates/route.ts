import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { email_templates } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { name, prompt, html } = await req.json();
  if (!name || !prompt || !html) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const [template] = await db.insert(email_templates).values({
    user_id: userId,
    name,
    prompt,
    html,
  }).returning();
  return NextResponse.json({ template });
}

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const templates = await db
    .select()
    .from(email_templates)
    .where(eq(email_templates.user_id, userId))
    .orderBy(desc(email_templates.created_at));
  return NextResponse.json({ templates });
}

export async function DELETE(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Missing template id" }, { status: 400 });
  }
  const result = await db.delete(email_templates)
    .where(and(eq(email_templates.id, id), eq(email_templates.user_id, userId)))
    .returning();
  if (result.length === 0) {
    return NextResponse.json({ error: "Template not found or not authorized" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, name, html, is_public } = await req.json();
  if (!id || (!name && !html && typeof is_public === 'undefined')) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const updateData: Record<string, unknown> = {};
  if (name) updateData.name = name;
  if (html) updateData.html = html;
  if (typeof is_public !== 'undefined') updateData.is_public = is_public;
  const result = await db.update(email_templates)
    .set(updateData)
    .where(and(eq(email_templates.id, id), eq(email_templates.user_id, userId)))
    .returning();
  if (result.length === 0) {
    return NextResponse.json({ error: "Template not found or not authorized" }, { status: 404 });
  }
  return NextResponse.json({ template: result[0] });
} 