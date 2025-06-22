import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";

import { EmailMatch, EmailSummary } from "@/types";

interface EmailResultsSectionProps {
  results: EmailMatch[];
  emailSummary: EmailSummary | null;
  summarizing: boolean;
  showEmails: boolean;
  setShowEmails: (show: boolean) => void;
  handleSummarize: () => void;
}

export const EmailResultsSection = ({
  results,
  emailSummary,
  summarizing,
  showEmails,
  setShowEmails,
  handleSummarize,
}: EmailResultsSectionProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>📧 Found {results.length} emails</CardTitle>
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
  );
};
