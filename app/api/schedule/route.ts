import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { scheduled_emails } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
        return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const emails = await db.select().from(scheduled_emails).where(eq(scheduled_emails.user_id, Number(user_id)));

    return NextResponse.json(emails);
}

export async function POST(request: NextRequest) {
    try {
        const { user_id, sender, recipient, subject, content, scheduled_date } = await request.json();
        if (!user_id || !sender || !recipient || !subject || !content || !scheduled_date) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }
        const inserted = await db.insert(scheduled_emails).values({ user_id, sender, recipient, subject, content, scheduled_date });
        return NextResponse.json(inserted);
    } catch (error) {
        return NextResponse.json({ error: "Failed to schedule email", details: error instanceof Error ? error.message : error }, { status: 500 });
    }
}