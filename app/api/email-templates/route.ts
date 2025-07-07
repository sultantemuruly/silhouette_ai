import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { email_templates } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

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