"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailSummarySection } from "./email-summary-section";

import { EmailMatch, SearchResponse, EmailSummary } from "@/types";
import { EmailResultsSection } from "./email-results-sections";

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

export default function EmailSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EmailMatch[]>([]);
  const [emailSummary, setEmailSummary] = useState<EmailSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmails, setShowEmails] = useState(true);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    const ok = await checkMeaning(query);
    if (!ok) {
      setError(
        "Your search looks like random characters. Please use real words."
      );
      setLoading(false);
      return;
    }

    setResults([]);
    setEmailSummary(null);

    try {
      const res = await fetch("/api/gmail/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queryText: query }),
      });

      if (!res.ok) throw new Error(await res.text());

      const data: SearchResponse = await res.json();
      setResults(data.matches);

      // Auto-summarize if we have results
      if (data.matches.length > 0) {
        await handleSummarize(data.matches);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async (emails?: EmailMatch[]) => {
    const emailsToSummarize = emails || results;
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

      const summary: EmailSummary = await res.json();
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
      {/* Search Section */}
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
              onClick={handleSearch}
              disabled={loading}
              className="flex justify-center items-center min-w-[100px]"
              variant={"regular"}
            >
              {loading ? (
                <Loader loadingText={null} additionalStyles="text-white" />
              ) : (
                "Search"
              )}
            </Button>
          </div>
          {error && (
            <div className="text-red-500 mt-2 p-2 bg-red-50 rounded">
              Error: {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Section */}
      {emailSummary && (
        <EmailSummarySection
          emailSummary={emailSummary}
          summarizing={summarizing}
        />
      )}

      {/* Results Section */}
      {results.length > 0 && (
        <EmailResultsSection
          results={results}
          emailSummary={emailSummary}
          summarizing={summarizing}
          showEmails={showEmails}
          setShowEmails={setShowEmails}
          handleSummarize={handleSummarize}
        />
      )}
    </div>
  );
}
