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

import { ImportanceAgent } from "@/agents";
import { MessagePreview } from "@/types";

export default function EmailImportantMessages() {
  const [pages, setPages] = useState<EmailData[][]>([]);
  const [importantPages, setImportantPages] = useState<EmailData[][]>([]);
  const [pageTokens, setPageTokens] = useState<(string | null)[]>([null]);
  const [pageIndex, setPageIndex] = useState(0);

  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedPreview, setSelectedPreview] = useState<EmailData | null>(
    null
  );
  const [fullEmail, setFullEmail] = useState<EmailData | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const activeCategory = "all";
  const IMPORTANCE_THRESHOLD = 0.6; // adjust as needed
  const USER_HINT = ""; // e.g. "urgent", "invoices", etc.

  const importanceAgent = React.useMemo(() => new ImportanceAgent(), []);

  const fetchPage = async (index: number) => {
    setLoadingList(true);
    setListError(null);

    try {
      // 1) fetch raw previews
      const token = pageTokens[index];
      const url = new URL("/api/gmail/messages", window.location.origin);
      if (token) url.searchParams.set("pageToken", token);
      url.searchParams.set("category", activeCategory);

      const res = await fetch(url.toString());
      if (res.status === 401) {
        window.location.href = "/sign-in";
        return;
      }
      if (!res.ok) throw new Error(await res.text());
      const { messages, nextPageToken } = await res.json();

      // 2) store full list
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

      // 3) run importance agent
      const previews: MessagePreview[] = messages.map(
        (m: {
          id: string;
          subject: string;
          from: string;
          date: string;
          snippet: string;
        }) => ({
          id: m.id,
          subject: m.subject,
          from: m.from,
          date: m.date,
          snippet: m.snippet,
        })
      );
      const important = await importanceAgent.selectImportant(previews, {
        threshold: IMPORTANCE_THRESHOLD,
        userHint: USER_HINT,
      });

      // 4) match back to your EmailData shape
      const importantFull = messages.filter((m: { id: string }) =>
        important.find((imp) => imp.id === m.id)
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

  // initial load & when category changes
  useEffect(() => {
    setPages([]);
    setImportantPages([]);
    setPageTokens([null]);
    setPageIndex(0);
    fetchPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  const canPrev = pageIndex > 0;
  const canNext = Boolean(pageTokens[pageIndex + 1]);

  const messages = pages[pageIndex] || [];
  const important = importantPages[pageIndex] || [];

  const handlePrev = () => canPrev && setPageIndex((i) => i - 1);
  const handleNext = () => {
    if (!canNext) return;
    const next = pageIndex + 1;
    setPageIndex(next);
    if (!pages[next]) fetchPage(next);
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
            : `${important.length} of ${messages.length} emails are important`}
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
          {loadingList && !messages.length ? (
            <Loader loadingText="Loading…" additionalStyles={null} />
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
