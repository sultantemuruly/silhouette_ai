"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Archive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Loader } from "../../ui/loader";
import { cn } from "@/lib/utils";

import { EmailViewModal } from "./email-view-modal";
import { EmailPreviewList } from "./email-preview-list";
import type { EmailData } from "@/types";
import { EMPTY_MESSAGES, CATEGORY_COLORS } from "@/constants";

export function EmailMessagesView() {
  // ---- list pagination / loading state ----
  const [pages, setPages] = useState<EmailData[][]>([]);
  const [pageTokens, setPageTokens] = useState<(string | null)[]>([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // ---- modal / email-fetch state ----
  const [selectedPreview, setSelectedPreview] = useState<EmailData | null>(
    null
  );
  const [fullEmail, setFullEmail] = useState<EmailData | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const activeCategory = "all";
  const categoryStyles = CATEGORY_COLORS[activeCategory] || {};
  const currentCategory = {
    id: "all",
    label: "All Mail",
    icon: <Archive className="h-4 w-4" />,
    description: "All your messages",
  };

  // Fetch page of previews
  const fetchPage = async (index: number) => {
    setLoadingList(true);
    setListError(null);
    try {
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

      setPages((prev) => {
        const copy = [...prev];
        copy[index] = messages;
        return copy;
      });

      setPageTokens((prev) => {
        const copy = [...prev];
        copy[index + 1] = nextPageToken;
        return copy;
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
    setPageTokens([null]);
    setPageIndex(0);
    fetchPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  const canPrev = pageIndex > 0;
  const canNext = !!pageTokens[pageIndex + 1];
  const messages = pages[pageIndex] || [];

  const handlePrev = () => {
    if (canPrev) setPageIndex(pageIndex - 1);
  };
  const handleNext = () => {
    if (canNext) {
      const next = pageIndex + 1;
      setPageIndex(next);
      if (!pages[next]) fetchPage(next);
    }
  };

  // Load full email into modal
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
      {/* pagination controls */}
      <div className="flex justify-center items-center space-x-4 mb-4">
        <Button onClick={handlePrev} disabled={!canPrev} variant="outline">
          &larr;
        </Button>
        <span className="text-sm font-medium">Page {pageIndex + 1}</span>
        <Button onClick={handleNext} disabled={!canNext} variant="outline">
          &rarr;
        </Button>
      </div>

      {/* message list */}
      <Card className="w-full max-w-6xl mx-auto shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={cn(
                  "p-2 rounded-lg",
                  categoryStyles.bg || "bg-primary/10",
                  categoryStyles.text || "text-primary"
                )}
              >
                {currentCategory.icon}
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {currentCategory.label}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {currentCategory.description}
                </p>
              </div>
            </div>
            {messages.length > 0 && (
              <Badge variant="secondary" className="hidden sm:flex">
                {messages.length} emails
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
          ) : !messages.length ? (
            <div className="p-8 text-center space-y-4">
              <p className="text-lg font-medium text-muted-foreground">
                {EMPTY_MESSAGES[activeCategory]?.title}
              </p>
              <p className="text-sm text-muted-foreground">
                {EMPTY_MESSAGES[activeCategory]?.description}
              </p>
            </div>
          ) : (
            <EmailPreviewList messages={messages} onEmailSelect={loadEmail} />
          )}
        </CardContent>
      </Card>

      {/* modal (opens as soon as you click) */}
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
