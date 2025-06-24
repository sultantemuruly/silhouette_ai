"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailSummarySection } from "./email-summary-section";
import { Badge } from "@/components/ui/badge";
import {
  EmailMatch,
  SearchResponse,
  EmailSummary,
  EmailData,
  PaginationState,
} from "@/types";
import { EmailResultsSection } from "./email-results-sections";
import { EmailViewModal } from "../email-view/email-view-modal";

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
  const [allResults, setAllResults] = useState<EmailMatch[]>([]);
  const [emailSummary, setEmailSummary] = useState<EmailSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmails, setShowEmails] = useState(true);
  const [openEmail, setOpenEmail] = useState<EmailData | null>(null);

  // Pagination states
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState<number | undefined>();
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    pageSize: 50,
  });

  const handleSearch = async (isLoadMore = false) => {
    if (!isLoadMore && !query.trim()) return;

    const searchQuery = query.trim();

    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);

        const ok = await checkMeaning(searchQuery);
        if (!ok) {
          setError(
            "Your search looks like random characters. Please use real words."
          );
          return;
        }

        // Reset states for new search
        setAllResults([]);
        setEmailSummary(null);
        setNextPageToken(undefined);
        setHasMore(false);
        setTotalCount(undefined);
      }

      const res = await fetch("/api/gmail/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queryText: searchQuery,
          pageToken: isLoadMore ? nextPageToken : undefined,
          limit: pagination.pageSize,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      const data: SearchResponse = await res.json();

      // Update results
      setAllResults((prev) =>
        isLoadMore ? [...prev, ...data.matches] : data.matches
      );
      setNextPageToken(data.nextPageToken);
      setHasMore(data.hasMore);
      setTotalCount(data.totalCount);

      // Update pagination
      const newTotalLoaded = isLoadMore
        ? allResults.length + data.matches.length
        : data.matches.length;

      setPagination((prev) => ({
        ...prev,
        totalPages: Math.ceil(newTotalLoaded / prev.pageSize),
      }));

      // Auto-summarize for new searches
      if (!isLoadMore && data.matches.length > 0) {
        await handleSummarize(data.matches);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleSummarize = async (emails?: EmailMatch[]) => {
    const emailsToSummarize = emails || allResults;
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

      setEmailSummary(await res.json());
    } catch (err) {
      console.error("Failed to generate summary:", err);
      setError("Failed to generate email summary");
    } finally {
      setSummarizing(false);
    }
  };

  const getPaginatedResults = () => {
    const start = (pagination.currentPage - 1) * pagination.pageSize;
    return allResults.slice(start, start + pagination.pageSize);
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const getBatchInfo = () => {
    if (allResults.length === 0) return null;

    const showingCount = Math.min(
      pagination.currentPage * pagination.pageSize,
      allResults.length
    );

    return `Showing ${showingCount} of ${totalCount || "many"} emails`;
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
                <Loader loadingText={null} additionalStyles={null} />
              ) : (
                "Search"
              )}
            </Button>
          </div>

          {/* Status information */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            {getBatchInfo() && (
              <Badge variant="secondary" className="text-sm">
                {getBatchInfo()}
              </Badge>
            )}

            {hasMore && (
              <Button
                onClick={() => handleSearch(true)}
                disabled={loadingMore}
                variant="outline"
                size="sm"
              >
                {loadingMore ? (
                  <Loader loadingText="Loading..." additionalStyles={null} />
                ) : (
                  "Load More Emails"
                )}
              </Button>
            )}
          </div>

          {error && (
            <div className="text-red-500 mt-2 p-2 bg-red-50 rounded">
              Error: {error}
            </div>
          )}
        </CardContent>
      </Card>

      {emailSummary && (
        <EmailSummarySection
          emailSummary={emailSummary}
          summarizing={summarizing}
        />
      )}

      {allResults.length > 0 && (
        <EmailResultsSection
          results={getPaginatedResults()}
          allResults={allResults}
          emailSummary={emailSummary}
          summarizing={summarizing}
          showEmails={showEmails}
          setShowEmails={setShowEmails}
          handleSummarize={handleSummarize}
          pagination={pagination}
          onPageChange={handlePageChange}
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
