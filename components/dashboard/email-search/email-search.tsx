"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";

interface EmailMatch {
  id: string;
  subject: string;
  from: string;
  date: string;
  body: string;
}

export default function EmailSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EmailMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/gmail/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queryText: query }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResults(data.matches);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
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
          variant={`regular`}
          className="flex justify-center items-center"
        >
          {loading ? (
            <Loader loadingText={null} additionalStyles={`text-white`} />
          ) : (
            `Search`
          )}
        </Button>
      </div>

      {error && <div className="text-red-500 mb-4">Error: {error}</div>}

      <div className="space-y-4">
        {results.map((email) => (
          <div
            key={email.id}
            className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-lg">{email.subject}</h3>
              <span className="text-sm text-gray-500">{email.date}</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">From: {email.from}</p>
            <div className="max-h-40 overflow-auto text-sm whitespace-pre-wrap">
              {email.body}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
