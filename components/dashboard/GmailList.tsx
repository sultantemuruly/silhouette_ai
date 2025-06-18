"use client";
import React, { useEffect, useState } from "react";

type Email = {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
};

export function GmailList() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gmail/messages")
      .then(async (res) => {
        if (res.status === 401) {
          // not signed in → send to Clerk
          window.location.href = "/sign-in";
          return { messages: [] };
        }
        if (!res.ok) {
          console.error("API error", res.status, await res.text());
          return { messages: [] };
        }
        return res.json();
      })
      .then((data) => setEmails(data.messages || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading your emails…</p>;
  if (!emails.length) return <p>No messages found.</p>;

  return (
    <ul className="space-y-4">
      {emails.map((mail) => (
        <li
          key={mail.id}
          className="p-4 border rounded-lg hover:shadow-md transition"
        >
          <p className="font-semibold">{mail.subject}</p>
          <p className="text-sm text-gray-600">{mail.from}</p>
          <p className="text-xs text-gray-500">{mail.date}</p>
          <p className="mt-2 text-sm">{mail.snippet}</p>
        </li>
      ))}
    </ul>
  );
}
