"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { EmailMatch, SearchResponse, EmailSummary } from "@/types";

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

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-100 text-green-800";
      case "negative":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
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
        <Card className="border-l-4 border-l-blue-600">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              📊 Email Summary
              <Badge className={getSentimentColor(emailSummary.sentiment)}>
                {emailSummary.sentiment}
              </Badge>
              <Badge className={getUrgencyColor(emailSummary.urgencyLevel)}>
                {emailSummary.urgencyLevel} priority
              </Badge>
            </CardTitle>
            {summarizing && (
              <Loader loadingText="Analyzing..." additionalStyles={null} />
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-gray-800 leading-relaxed">
                {emailSummary.summary}
              </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-semibold text-lg">
                  {emailSummary.emailCount}
                </div>
                <div className="text-gray-600">Emails</div>
              </div>
              {emailSummary.dateRange && (
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-semibold text-xs">
                    {emailSummary.dateRange}
                  </div>
                  <div className="text-gray-600">Date Range</div>
                </div>
              )}
              {emailSummary.topSenders && (
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-semibold text-lg">
                    {emailSummary.topSenders.length}
                  </div>
                  <div className="text-gray-600">Top Senders</div>
                </div>
              )}
              {emailSummary.urgentEmails && (
                <div className="text-center p-2 bg-red-50 rounded">
                  <div className="font-semibold text-lg text-red-600">
                    {emailSummary.urgentEmails.length}
                  </div>
                  <div className="text-red-600">Urgent</div>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Key Points */}
              {emailSummary.keyPoints.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    🔑 Key Points
                  </h4>
                  <ul className="space-y-1">
                    {emailSummary.keyPoints.map((point, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm"
                      >
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Items */}
              {emailSummary.actionItems &&
                emailSummary.actionItems.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      ✅ Action Items
                    </h4>
                    <ul className="space-y-1">
                      {emailSummary.actionItems.map((item, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm"
                        >
                          <span className="text-green-500 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>

            {/* Additional Info */}
            <Separator />
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              {emailSummary.topSenders &&
                emailSummary.topSenders.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">👥 Top Senders</h4>
                    <div className="flex flex-wrap gap-1">
                      {emailSummary.topSenders
                        .slice(0, 5)
                        .map((sender, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {sender}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}

              {emailSummary.urgentEmails &&
                emailSummary.urgentEmails.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-red-600">
                      🚨 Urgent Items
                    </h4>
                    <ul className="space-y-1">
                      {emailSummary.urgentEmails
                        .slice(0, 3)
                        .map((item, index) => (
                          <li
                            key={index}
                            className="text-xs text-red-700 bg-red-50 p-1 rounded"
                          >
                            {item}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {results.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>📧 Found {results.length} emails</CardTitle>
            <div className="flex gap-2">
              {!emailSummary && (
                <Button
                  onClick={() => handleSummarize()}
                  disabled={summarizing}
                  variant="outline"
                  size="sm"
                >
                  {summarizing ? (
                    <Loader
                      loadingText="Summarizing..."
                      additionalStyles={null}
                    />
                  ) : (
                    "📊 Summarize"
                  )}
                </Button>
              )}
              <Button
                onClick={() => setShowEmails(!showEmails)}
                variant="outline"
                size="sm"
              >
                {showEmails ? "Hide Emails" : "Show Emails"}
              </Button>
            </div>
          </CardHeader>
          {showEmails && (
            <CardContent>
              <div className="space-y-4">
                {results.map((email) => (
                  <div
                    key={email.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg line-clamp-2">
                        {email.subject}
                      </h3>
                      <span className="text-sm text-gray-500 whitespace-nowrap ml-2">
                        {new Date(email.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      <strong>From:</strong> {email.from}
                    </p>
                    <div className="max-h-32 overflow-auto text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      {email.preview || email.body.substring(0, 300)}
                      {email.body.length > 300 && "..."}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
