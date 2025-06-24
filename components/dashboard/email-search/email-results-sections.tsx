import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { Badge } from "@/components/ui/badge";
import { EmailPreviewList } from "../email-view/email-preview-list";
import { EmailMatch, EmailSummary, PaginationState } from "@/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface EmailResultsSectionProps {
  results: EmailMatch[];
  allResults: EmailMatch[];
  emailSummary: EmailSummary | null;
  summarizing: boolean;
  showEmails: boolean;
  setShowEmails: (show: boolean) => void;
  handleSummarize: () => void;
  pagination: PaginationState;
  onPageChange: (page: number) => void;
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
  pagination,
  onPageChange,
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

  const renderPagination = () => {
    if (allResults.length <= pagination.pageSize) return null;

    const totalPages = Math.ceil(allResults.length / pagination.pageSize);
    const currentPage = pagination.currentPage;

    return (
      <div className="flex items-center justify-between mt-4 pt-4 border-t">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>
            Showing{" "}
            {Math.min(
              (currentPage - 1) * pagination.pageSize + 1,
              allResults.length
            )}{" "}
            to {Math.min(currentPage * pagination.pageSize, allResults.length)}{" "}
            of {allResults.length} emails
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <CardTitle>📧 Found {allResults.length} emails</CardTitle>
          {allResults.length > pagination.pageSize && (
            <Badge variant="secondary" className="text-sm">
              Page {pagination.currentPage} of{" "}
              {Math.ceil(allResults.length / pagination.pageSize)}
            </Badge>
          )}
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
          {renderPagination()}
        </CardContent>
      )}
    </Card>
  );
};
