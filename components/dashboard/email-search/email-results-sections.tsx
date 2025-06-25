import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { EmailPreviewList } from "../email-view/email-preview-list";
import { EmailMatch, EmailSummary } from "@/types";

interface EmailResultsSectionProps {
  results: EmailMatch[];
  allResults: EmailMatch[];
  emailSummary: EmailSummary | null;
  summarizing: boolean;
  showEmails: boolean;
  setShowEmails: (show: boolean) => void;
  handleSummarize: () => void;
  onEmailSelect: (email: EmailMatch) => void;
}

export const EmailResultsSection = ({
  results,
  allResults,
  emailSummary,
  summarizing,
  showEmails,
  setShowEmails,
  handleSummarize,
  onEmailSelect,
}: EmailResultsSectionProps) => {
  // Convert EmailMatch[] to EmailData[] for EmailPreviewList
  const messages = results.map((email) => ({
    id: email.id,
    subject: email.subject,
    from: email.from,
    date: email.date,
    snippet: email.preview || email.body.substring(0, 300),
    body: email.body,
  }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <CardTitle>📧 Found {allResults.length} emails</CardTitle>
        </div>
        <div className="flex gap-2">
          {!emailSummary && (
            <Button
              onClick={handleSummarize}
              disabled={summarizing}
              variant="outline"
              size="sm"
            >
              {summarizing ? (
                <Loader loadingText="Summarizing..." additionalStyles={null} />
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
          <EmailPreviewList
            messages={messages}
            onEmailSelect={(data) => {
              const match = allResults.find((e) => e.id === data.id);
              if (match) onEmailSelect(match);
            }}
          />
        </CardContent>
      )}
    </Card>
  );
};
