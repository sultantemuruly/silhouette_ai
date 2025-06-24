import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { EmailSummary } from "@/types";
import { Separator } from "@/components/ui/separator";
import { Loader } from "@/components/ui/loader";

interface EmailSummarySectionProps {
  emailSummary: EmailSummary;
  summarizing: boolean;
}

export const EmailSummarySection = ({
  emailSummary,
  summarizing,
}: EmailSummarySectionProps) => {
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
        <div>
          {summarizing && (
            <Loader loadingText="Analyzing..." additionalStyles={null} />
          )}
        </div>
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
                    <li key={index} className="flex items-start gap-3 text-sm">
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
                    <li key={index} className="flex items-start gap-3 text-sm">
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
  );
};
