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
        return "bg-green-200 text-green-900";
      case "negative":
        return "bg-red-200 text-red-900";
      default:
        return "bg-gray-200 text-gray-900";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "bg-red-200 text-red-900";
      case "medium":
        return "bg-yellow-100 text-yellow-900";
      default:
        return "bg-blue-200 text-blue-900";
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
        <Card className="border-l-4 border-l-blue-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="flex items-center gap-3">
              <span className="text-xl">📊</span>
              <span className="text-lg font-semibold">Email Summary</span>
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
          <CardContent className="space-y-6">
            {/* Main Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-5 rounded-lg">
              <p className="text-gray-900 leading-relaxed font-medium">
                {emailSummary.summary}
              </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
              <div className="text-center p-4 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="font-bold text-2xl text-slate-800">
                  {emailSummary.emailCount}
                </div>
                <div className="text-slate-600 font-medium">Emails</div>
              </div>

              {emailSummary.dateRange && (
                <div className="text-center p-4 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="font-semibold text-sm text-slate-800 break-words">
                    {emailSummary.dateRange}
                  </div>
                  <div className="text-slate-600 font-medium">Date Range</div>
                </div>
              )}

              {emailSummary.topSenders && (
                <div className="text-center p-4 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="font-bold text-2xl text-slate-800">
                    {emailSummary.topSenders?.length || 0}
                  </div>
                  <div className="text-slate-600 font-medium">Top Senders</div>
                </div>
              )}

              {emailSummary.urgentEmails &&
                emailSummary.urgentEmails.length > 0 && (
                  <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                    <div className="font-bold text-2xl text-red-700">
                      {emailSummary.urgentEmails?.length || 0}
                    </div>
                    <div className="text-red-600 font-medium">Urgent</div>
                  </div>
                )}
            </div>

            {/* Key Points and Action Items */}
            {((emailSummary.keyPoints?.length ?? 0) > 0 ||
              (emailSummary.actionItems?.length ?? 0) > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Key Points */}
                {(emailSummary.keyPoints?.length ?? 0) > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-emerald-900">
                      <span className="text-lg">🔑</span>
                      Key Points
                    </h4>
                    <ul className="space-y-2">
                      {emailSummary.keyPoints?.map((point, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 text-sm"
                        >
                          <span className="text-emerald-900 mt-1 font-bold flex-shrink-0">
                            •
                          </span>
                          <span className="text-gray-900 leading-relaxed">
                            {point}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Items */}
                {(emailSummary.actionItems?.length ?? 0) > 0 && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-amber-900">
                      <span className="text-lg">✅</span>
                      Action Items
                    </h4>
                    <ul className="space-y-2">
                      {emailSummary.actionItems?.map((item, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 text-sm"
                        >
                          <span className="text-amber-900 mt-1 font-bold flex-shrink-0">
                            •
                          </span>
                          <span className="text-gray-900 leading-relaxed">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Additional Info */}
            {((emailSummary.topSenders?.length ?? 0) > 0 ||
              (emailSummary.urgentEmails?.length ?? 0) > 0) && (
              <>
                <Separator className="my-6" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm">
                  {/* Top Senders */}
                  {(emailSummary.topSenders?.length ?? 0) > 0 && (
                    <div className="bg-violet-50 border border-violet-200 p-4 rounded-lg">
                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-violet-900">
                        <span className="text-lg">👥</span>
                        Top Senders
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {emailSummary.topSenders
                          ?.slice(0, 5)
                          ?.map((sender, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs bg-violet-100 text-violet-900 border-violet-300 hover:bg-violet-200 break-all"
                            >
                              {sender}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Urgent Items */}
                  {(emailSummary.urgentEmails?.length ?? 0) > 0 && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-800">
                        <span className="text-lg">🚨</span>
                        Urgent Items
                      </h4>
                      <ul className="space-y-2">
                        {emailSummary.urgentEmails
                          ?.slice(0, 3)
                          ?.map((item, index) => (
                            <li
                              key={index}
                              className="text-sm text-red-800 bg-red-100 border border-red-200 p-2 rounded font-medium break-words"
                            >
                              {item}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              </>
            )}
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
