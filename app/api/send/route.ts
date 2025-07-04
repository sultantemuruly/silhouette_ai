import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    const { sender, recipient, subject, content } = await req.json();
  try {
    const { data, error } = await resend.emails.send({
      from: "Silhouette AI <noreply@silhai.com>",
      to: [recipient],
      subject,
      react:`
          <h3>${sender} is sending you:</h3>
          <p>${content.replace(/\n/g, "<br>")}</p>
        `,
    });

    if (error) {
      return Response.json({ error }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}