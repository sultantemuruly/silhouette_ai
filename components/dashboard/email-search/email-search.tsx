"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailSummarySection } from "./email-summary-section";
import { Badge } from "@/components/ui/badge";
import { EmailMatch, EmailSummary, EmailData } from "@/types";
import { EmailResultsSection } from "./email-results-sections";
import { EmailViewModal } from "../email-view/email-view-modal";
import { Info } from "lucide-react";

async function checkMeaning(query: string): Promise<boolean> {
  const res = await fetch("/api/utils/check-query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) return false;
  const { isMeaningful } = await res.json();
  return isMeaningful;
}

// Define a type for the keyword endpoint response
interface KeywordEmail {
  id: string;
  subject: string;
  from: string;
  date: string;
  body: string;
}

export default function EmailSearch() {
  const [query, setQuery] = useState("");
  const [pageResults, setPageResults] = useState<EmailMatch[]>([]);
  const [emailSummary, setEmailSummary] = useState<EmailSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmails, setShowEmails] = useState(true);
  const [openEmail, setOpenEmail] = useState<EmailData | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    const searchQuery = query.trim();
    setLoading(true);
    setError(null);
    setPageResults([]);
    setEmailSummary(null);
    setKeywords([]);
    try {
      const ok = await checkMeaning(searchQuery);
      if (!ok) {
        setError(
          "Your search looks like random characters. Please use real words."
        );
        setLoading(false);
        return;
      }
      const res = await fetch("/api/gmail/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPageResults(
        (data.emails || []).map((email: KeywordEmail) => ({
          id: email.id,
          subject: email.subject,
          from: email.from,
          date: email.date,
          body: email.body,
          preview: email.body?.slice(0, 300) || "",
        }))
      );
      setKeywords(data.keywords || []);
      if ((data.emails || []).length > 0) {
        await handleSummarize(
          (data.emails || []).map((email: KeywordEmail) => ({
            id: email.id,
            subject: email.subject,
            from: email.from,
            date: email.date,
            body: email.body,
            preview: email.body?.slice(0, 300) || "",
          }))
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async (emails?: EmailMatch[]) => {
    const emailsToSummarize = emails || pageResults;
    if (emailsToSummarize.length === 0) return;

    setSummarizing(true);
    try {
      const res = await fetch("/api/gmail/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails: emailsToSummarize,
          query: query.trim(),
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      const summaryRaw = await res.json();
      let summary = summaryRaw;
      // If the summary is a string (sometimes happens if the backend returns a stringified JSON)
      if (typeof summary === "string") {
        let clean = summary.trim();
        if (clean.startsWith("json")) {
          clean = clean.replace(/^json\s*/i, "");
        }
        try {
          summary = JSON.parse(clean);
        } catch (e) {
          console.error(e);
          // fallback: just show the string if parsing fails
          summary = { summary: clean };
        }
      }
      setEmailSummary(summary);
    } catch (err) {
      console.error("Failed to generate summary:", err);
      setError("Failed to generate email summary");
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <Input
              placeholder="Search your emails..."
              className="flex-1"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button
              onClick={() => handleSearch()}
              disabled={loading}
              className="min-w-[100px]"
              variant="regular"
            >
              {loading ? (
                <Loader loadingText={null} additionalStyles={'text-white'} />
              ) : (
                "Search"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Extracted Keywords Section */}
      {keywords.length > 0 && (
        <Card className="mt-4 border-blue-200 bg-blue-50/60">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Info className="w-4 h-4 text-blue-600" />
            <CardTitle className="text-base text-blue-900">Extracted Keywords</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 items-center pt-0">
            {keywords.map((kw) => (
              <Badge
                key={kw}
                variant="outline"
                className="text-xs border-blue-400 bg-white text-blue-800 px-2 py-1 rounded-full shadow-sm hover:bg-blue-100 transition"
                title="Keyword used for search"
              >
                {kw}
              </Badge>
            ))}
            <span className="ml-2 text-xs text-blue-700/80">These keywords were automatically extracted from your query and used to find relevant emails.</span>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="text-red-500 mt-2 p-2 bg-red-50 rounded">
          Error: {error}
        </div>
      )}

      {/* Summarizing loader banner */}
      {summarizing && (
        <div className="w-full flex justify-center items-center mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-6 py-3 flex items-center gap-3">
            <span className="text-blue-900 font-medium">
              Summarizing your search results...
            </span>
          </div>
        </div>
      )}

      {emailSummary && (
        <EmailSummarySection
          emailSummary={emailSummary}
          summarizing={summarizing}
        />
      )}

      {pageResults.length > 0 && (
        <EmailResultsSection
          results={pageResults}
          allResults={pageResults}
          emailSummary={emailSummary}
          summarizing={summarizing}
          showEmails={showEmails}
          setShowEmails={setShowEmails}
          handleSummarize={handleSummarize}
          onEmailSelect={(match) =>
            setOpenEmail({
              id: match.id,
              subject: match.subject,
              from: match.from,
              date: match.date,
              snippet: match.preview || match.body.substring(0, 300),
              body: match.body,
            })
          }
        />
      )}

      <EmailViewModal
        email={openEmail}
        onClose={() => setOpenEmail(null)}
        preview={null}
        loading={false}
        error={null}
      />
    </div>
  );
}
