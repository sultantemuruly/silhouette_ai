"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Loader2, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import EmailViewModal from "./EmailViewModal";

export type Email = {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  body: string;
  date: string;
};

export function GmailList() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  async function fetchPage(token?: string) {
    try {
      setLoading(true);
      const url = new URL("/api/gmail/messages", window.location.origin);
      if (token) url.searchParams.set("pageToken", token);

      const res = await fetch(url.toString());
      if (res.status === 401) {
        window.location.href = "/sign-in";
        return;
      }
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API ${res.status}: ${text}`);
      }

      const { messages, nextPageToken: next } = await res.json();
      setEmails((prev) => (token ? [...prev, ...messages] : messages));
      setNextPageToken(next);
    } catch (err) {
      console.error(err);
      setError("Failed to load emails.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPage();
  }, []);

  return (
    <>
      <Card className="w-full max-w-3xl mx-auto shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3">
            <Mail className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Your Inbox</CardTitle>
            {emails.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {emails.length} {emails.length === 1 ? "email" : "emails"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {loading && !emails.length ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-red-600 font-medium">{error}</p>
              <Button
                variant="ghost"
                onClick={() => fetchPage()}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          ) : !emails.length ? (
            <div className="p-6 text-center">
              <Mail className="mx-auto h-10 w-10 text-gray-400 mb-3" />
              <p className="text-gray-500">No messages found in your inbox</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <ul className="divide-y">
                {emails.map((mail) => (
                  <li
                    key={mail.id}
                    className="px-4 py-3 hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedEmail(mail)}
                  >
                    <div className="flex gap-3 items-start">
                      <div className="bg-primary/10 p-2 rounded-full mt-1">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline gap-2">
                          <p className="font-medium truncate text-gray-900">
                            {mail.subject || "(No subject)"}
                          </p>
                          <p className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(mail.date), "PP")}
                          </p>
                        </div>
                        <p className="text-sm text-primary/80 truncate mt-1">
                          {mail.from}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {mail.snippet}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
        {nextPageToken && (
          <CardFooter className="border-t py-3">
            <Button
              onClick={() => fetchPage(nextPageToken)}
              disabled={loading}
              variant="ghost"
              className="w-full"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Load more messages"
              )}
            </Button>
          </CardFooter>
        )}
      </Card>

      <EmailViewModal
        email={selectedEmail}
        onClose={() => setSelectedEmail(null)}
      />
    </>
  );
}
