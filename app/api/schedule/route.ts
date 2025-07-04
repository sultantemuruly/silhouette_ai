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
        const body = await request.json();
        console.log('Received POST /api/schedule body:', body);
        const { user_id, sender, recipient, subject, content, scheduled_date } = body;
        if (!user_id || !sender || !recipient || !subject || !content || !scheduled_date) {
            console.log('Missing required fields:', { user_id, sender, recipient, subject, content, scheduled_date });
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }
        console.log('Inserting scheduled email:', { user_id, sender, recipient, subject, content, scheduled_date });
        const inserted = await db.insert(scheduled_emails).values({
          user_id,
          sender,
          recipient,
          subject,
          content,
          scheduled_date: new Date(scheduled_date),
        });
        return NextResponse.json(inserted);
    } catch (error) {
        console.error('Error in POST /api/schedule:', error);
        return NextResponse.json({ error: "Failed to schedule email", details: error instanceof Error ? error.message : error }, { status: 500 });
    }
}