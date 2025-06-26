"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Archive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Loader } from "../../ui/loader";
import { cn } from "@/lib/utils";
import { EmailViewModal } from "../email-view/email-view-modal";
import { EmailPreviewList } from "../email-view/email-preview-list";
import type { EmailData } from "@/types";
import { CATEGORY_COLORS } from "@/constants";

const EMAILS_PER_PAGE = 10;
const IMPORTANCE_THRESHOLD = 0.6;
const USER_HINT = "";

export default function EmailImportantMessages() {
  // Pagination state
  const [pages, setPages] = useState<EmailData[][]>([]);
  const [importantPages, setImportantPages] = useState<EmailData[][]>([]);
  const [pageTokens, setPageTokens] = useState<(string | null)[]>([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // Modal/email state
  const [selectedPreview, setSelectedPreview] = useState<EmailData | null>(null);
  const [fullEmail, setFullEmail] = useState<EmailData | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const activeCategory = "all";

  // Fetch a page of emails and run importance agent
  const fetchPage = async (index: number) => {
    setLoadingList(true);
    setListError(null);
    try {
      const token = pageTokens[index];
      const url = new URL("/api/gmail/messages", window.location.origin);
      if (token) url.searchParams.set("pageToken", token);
      url.searchParams.set("category", activeCategory);
      url.searchParams.set("mailCount", EMAILS_PER_PAGE.toString());
      const res = await fetch(url.toString());
      if (res.status === 401) {
        window.location.href = "/sign-in";
        return;
      }
      if (!res.ok) throw new Error(await res.text());
      const { messages, nextPageToken } = await res.json();
      setPages((prev) => {
        const cp = [...prev];
        cp[index] = messages;
        return cp;
      });
      setPageTokens((prev) => {
        const cp = [...prev];
        cp[index + 1] = nextPageToken;
        return cp;
      });
      // Run importance agent on this page's messages
      const scoreRes = await fetch("/api/importance/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((m: any) => ({
            id: m.id,
            subject: m.subject,
            from: m.from,
            date: m.date,
            snippet: m.snippet,
          })),
          threshold: IMPORTANCE_THRESHOLD,
          userHint: USER_HINT,
        }),
      });
      if (!scoreRes.ok) throw new Error(await scoreRes.text());
      const { important } = await scoreRes.json();
      const importantFull = messages.filter((m: { id: string }) =>
        important.find((imp: { id: string }) => imp.id === m.id)
      );
      setImportantPages((prev) => {
        const cp = [...prev];
        cp[index] = importantFull;
        return cp;
      });
    } catch (err) {
      console.error(err);
      setListError("Failed to load emails.");
    } finally {
      setLoadingList(false);
    }
  };

  // Initial load & on category change
  useEffect(() => {
    setPages([]);
    setImportantPages([]);
    setPageTokens([null]);
    setPageIndex(0);
    fetchPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  const canPrev = pageIndex > 0;
  const canNext = !!pageTokens[pageIndex + 1];
  const messages = pages[pageIndex] || [];
  const important = importantPages[pageIndex] || [];

  const handlePrev = () => {
    if (canPrev) setPageIndex((i) => i - 1);
  };
  const handleNext = () => {
    if (canNext) {
      const next = pageIndex + 1;
      setPageIndex(next);
      if (!pages[next]) fetchPage(next);
    }
  };

  const loadEmail = async (preview: EmailData) => {
    setSelectedPreview(preview);
    setFullEmail(null);
    setEmailError(null);
    setLoadingEmail(true);
    try {
      const res = await fetch(`/api/gmail/messages/${preview.id}`);
      if (!res.ok) throw new Error(await res.text());
      const full = await res.json();
      setFullEmail({
        id: full.id,
        subject: full.subject,
        from: full.from,
        date: full.date,
        snippet: preview.snippet,
        body: full.html,
      });
    } catch (err) {
      console.error(err);
      setEmailError("Failed to load email content.");
    } finally {
      setLoadingEmail(false);
    }
  };

  const closeModal = () => {
    setSelectedPreview(null);
    setFullEmail(null);
    setEmailError(null);
    setLoadingEmail(false);
  };

  return (
    <>
      {/* pagination & count */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <Button onClick={handlePrev} disabled={!canPrev} variant="outline">
            &larr;
          </Button>
          <span className="mx-2 font-medium">Page {pageIndex + 1}</span>
          <Button onClick={handleNext} disabled={!canNext} variant="outline">
            &rarr;
          </Button>
        </div>
        <div className="text-sm">
          {loadingList
            ? "Scoring importance…"
            : `${important.length} out of ${messages.length} emails are important`}
        </div>
      </div>

      <Card className="w-full max-w-6xl mx-auto shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={cn(
                  "p-2 rounded-lg",
                  CATEGORY_COLORS[activeCategory].bg,
                  CATEGORY_COLORS[activeCategory].text
                )}
              >
                <Archive className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {activeCategory === "all"
                    ? "Important Mails"
                    : activeCategory}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Your important messages
                </p>
              </div>
            </div>
            {messages.length > 0 && (
              <Badge variant="secondary" className="hidden sm:flex">
                {important.length} important
              </Badge>
            )}
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {loadingList ? (
            <div className="flex flex-col items-center justify-center min-h-[200px]">
              <Loader loadingText={"Scoring importance…"} additionalStyles={null} />
            </div>
          ) : listError ? (
            <div className="p-6 text-center space-y-3">
              <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />
              <p className="text-red-600 font-medium">{listError}</p>
            </div>
          ) : !important.length ? (
            <div className="p-8 text-center space-y-4">
              <p className="text-lg font-medium text-muted-foreground">
                No important emails on this page.
              </p>
            </div>
          ) : (
            <EmailPreviewList messages={important} onEmailSelect={loadEmail} />
          )}
        </CardContent>
      </Card>

      <EmailViewModal
        preview={selectedPreview}
        email={fullEmail}
        loading={loadingEmail}
        error={emailError}
        onClose={closeModal}
      />
    </>
  );
}
