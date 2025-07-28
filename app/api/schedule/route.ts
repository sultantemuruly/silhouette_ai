import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { scheduled_emails } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DateTime } from 'luxon';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
        return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const emails = await db.select().from(scheduled_emails).where(eq(scheduled_emails.user_id, user_id));

    return NextResponse.json(emails);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('Received POST /api/schedule body:', body);
        const { user_id, sender, recipients, subject, content, scheduled_date, timezone } = body;
        if (!user_id || !sender || !recipients || !recipients.length || !subject || !content || !scheduled_date) {
            console.log('Missing required fields:', { user_id, sender, recipients, subject, content, scheduled_date });
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }
        let effectiveZone = timezone;
        const kzTimezones = [
            'Asia/Almaty',
            'Asia/Aqtobe',
            'Asia/Aqtau',
            'Asia/Oral',
            'Asia/Atyrau',
            'Asia/West Kazakhstan',
        ];
        if (timezone && kzTimezones.includes(timezone)) {
            effectiveZone = 'UTC+5';
        }
        let scheduledDateUtc: Date;
        if (effectiveZone) {
            scheduledDateUtc = DateTime.fromFormat(scheduled_date, "yyyy-MM-dd'T'HH:mm:ss", { zone: effectiveZone }).toUTC().toJSDate();
        } else {
            scheduledDateUtc = new Date(scheduled_date);
        }
        // Insert one record per recipient
        const inserted = [];
        for (const recipient of recipients) {
            console.log('Inserting scheduled email:', { user_id, sender, recipient, subject, content, scheduled_date, timezone, scheduledDateUtc });
            const result = await db.insert(scheduled_emails).values({
                user_id,
                sender,
                recipient,
                subject,
                content,
                scheduled_date: scheduledDateUtc,
                status: 'pending',
                timezone,
            });
            inserted.push(result);
        }
        return NextResponse.json(inserted);
    } catch (error) {
        console.error('Error in POST /api/schedule:', error);
        return NextResponse.json({ error: "Failed to schedule email", details: error instanceof Error ? error.message : error }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('PATCH /api/schedule body:', body);
        const { id, user_id, subject, recipient, content, scheduled_date, timezone } = body;
        if (!id || !user_id) {
            return NextResponse.json({ error: "ID and User ID are required" }, { status: 400 });
        }
        const [email] = await db.select().from(scheduled_emails).where(
            eq(scheduled_emails.id, id)
        );
        if (!email) {
            return NextResponse.json({ error: "Email not found" }, { status: 404 });
        }
        if (email.user_id !== user_id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
        if (email.status !== 'pending') {
            return NextResponse.json({ error: "Only pending emails can be updated" }, { status: 400 });
        }
        let effectiveZone = timezone;
        const kzTimezones = [
            'Asia/Almaty',
            'Asia/Aqtobe',
            'Asia/Aqtau',
            'Asia/Oral',
            'Asia/Atyrau',
            'Asia/West Kazakhstan',
        ];
        if (timezone && kzTimezones.includes(timezone)) {
            effectiveZone = 'UTC+5';
        }
        let scheduledDateUtc: Date;
        if (effectiveZone) {
            // Try ISO first, then fallback to fromFormat
            let dt = DateTime.fromISO(scheduled_date, { zone: effectiveZone });
            if (!dt.isValid) {
                dt = DateTime.fromFormat(scheduled_date, "yyyy-MM-dd'T'HH:mm:ss", { zone: effectiveZone });
            }
            if (!dt.isValid) throw new Error('Invalid scheduled_date format');
            scheduledDateUtc = dt.toUTC().toJSDate();
        } else {
            scheduledDateUtc = new Date(scheduled_date);
        }
        await db.update(scheduled_emails)
            .set({ subject, recipient, content, scheduled_date: scheduledDateUtc, timezone })
            .where(eq(scheduled_emails.id, id));
        const [updated] = await db.select().from(scheduled_emails).where(eq(scheduled_emails.id, id));
        console.log('Updated scheduled email:', updated);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in PATCH /api/schedule:', error);
        return NextResponse.json({ error: "Failed to update scheduled email", details: error instanceof Error ? error.message : error }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const user_id = searchParams.get("user_id");
        if (!id || !user_id) {
            return NextResponse.json({ error: "ID and User ID are required" }, { status: 400 });
        }
        const [email] = await db.select().from(scheduled_emails).where(
            eq(scheduled_emails.id, Number(id))
        );
        if (!email) {
            return NextResponse.json({ error: "Email not found" }, { status: 404 });
        }
        if (email.user_id !== user_id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
        if (email.status !== 'pending') {
            return NextResponse.json({ error: "Only pending emails can be deleted" }, { status: 400 });
        }
        await db.delete(scheduled_emails).where(eq(scheduled_emails.id, Number(id)));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in DELETE /api/schedule:', error);
        return NextResponse.json({ error: "Failed to delete scheduled email", details: error instanceof Error ? error.message : error }, { status: 500 });
    }
}