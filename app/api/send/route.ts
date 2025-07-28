import { Resend } from 'resend';
import { db } from '@/lib/db';
import { scheduled_emails } from '@/db/schema';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    const { sender, recipients, subject, content, user_id, timezone } = await req.json();
  try {
    const { data, error } = await resend.emails.send({
      from: "Silhouette AI <noreply@silhai.com>",
      to: recipients,
      subject,
      html:`
          <h3>${sender} is sending you:</h3>
          <p>${content.replace(/\n/g, "<br>")}</p>
        `,
    });

    if (error) {
      return Response.json({ error }, { status: 500 });
    }

    // Save to scheduled_emails as 'sent' if user_id and sender are present
    if (user_id && sender) {
      // Save one record per recipient
      for (const recipient of recipients) {
        await db.insert(scheduled_emails).values({
          user_id,
          sender,
          recipient,
          subject,
          content,
          scheduled_date: new Date(),
          status: 'sent',
          timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      }
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}