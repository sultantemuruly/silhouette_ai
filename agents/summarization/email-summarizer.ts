import { BaseSummarizationAgent } from "./base-summarizer";
import {
  EmailSummaryOptions,
  EmailMatch,
  EmailSummaryResult,
} from "@/types";
import { SummaryOptions } from "./base-summarizer";

export class EmailSummarizationAgent extends BaseSummarizationAgent {
  constructor() {
    super(0.2); // Lower temperature for more focused email summaries
  }

  async summarizeEmails(
    emails: EmailMatch[],
    query: string,
    options: EmailSummaryOptions = {}
  ): Promise<EmailSummaryResult> {
    if (emails.length === 0) {
      return {
        summary: "No emails found to summarize.",
        keyPoints: [],
        emailCount: 0,
        sentiment: "neutral",
        urgencyLevel: "low",
      };
    }

    // Prepare email content for summarization
    const emailContent = this.prepareEmailContent(emails, query);

    // Create email-specific options
    const summaryOptions: SummaryOptions = {
      ...options,
      userQuery: query,
      focusAreas: [
        `emails related to: ${query}`,
        "important dates and deadlines",
        "key decisions or outcomes",
        "action items and next steps",
        ...(options.focusAreas || []),
      ],
      includeActionItems: true,
      includeKeyPoints: true,
    };

    // Get base summary
    const baseSummary = await this.summarize(emailContent, summaryOptions);

    // Extract email-specific insights
    const insights = this.extractEmailInsights(emails);

    return {
      ...baseSummary,
      emailCount: emails.length,
      ...insights,
    };
  }

  private prepareEmailContent(emails: EmailMatch[], query: string): string {
    const sortedEmails = emails
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20); // Limit to most recent 20 emails to avoid token limits

    const content = `
SEARCH QUERY: ${query}
TOTAL EMAILS FOUND: ${emails.length}

EMAIL DETAILS:
${sortedEmails
  .map(
    (email, index) => `
${index + 1}. SUBJECT: ${email.subject}
   FROM: ${email.from}
   DATE: ${email.date}
   CONTENT: ${email.body.slice(0, 500)}${email.body.length > 500 ? "..." : ""}
`
  )
  .join("\n")}

Please analyze these emails in the context of the search query and provide insights about the main themes, important information, and any actionable items.
    `;

    return content;
  }

  private extractEmailInsights(emails: EmailMatch[]) {
    // Extract date range
    const dates = emails
      .map((email) => new Date(email.date))
      .filter((date) => !isNaN(date.getTime()));
    const dateRange =
      dates.length > 0
        ? `${new Date(
            Math.min(...dates.map((d) => d.getTime()))
          ).toLocaleDateString()} - ${new Date(
            Math.max(...dates.map((d) => d.getTime()))
          ).toLocaleDateString()}`
        : undefined;

    // Extract top senders
    const senderCounts = emails.reduce((acc, email) => {
      const sender = email.from.split("<")[0].trim();
      acc[sender] = (acc[sender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topSenders = Object.entries(senderCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([sender]) => sender);

    // Identify potentially urgent emails (based on subject keywords)
    const urgentKeywords = [
      "urgent",
      "asap",
      "emergency",
      "critical",
      "deadline",
      "important",
    ];
    const urgentEmails = emails
      .filter((email) =>
        urgentKeywords.some(
          (keyword) =>
            email.subject.toLowerCase().includes(keyword) ||
            email.body.toLowerCase().includes(keyword)
        )
      )
      .map((email) => email.subject)
      .slice(0, 5);

    return {
      dateRange,
      topSenders,
      urgentEmails: urgentEmails.length > 0 ? urgentEmails : undefined,
    };
  }
}
