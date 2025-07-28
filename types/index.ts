export type EmailData = {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  body: string;
  htmlBody?: string;
  date: string;
};

export interface EmailMatch {
  id: string;
  subject: string;
  from: string;
  date: string;
  to: string;
  body: string;
  htmlBody?: string;
  preview?: string;
}

export interface SearchResponse {
  matches: EmailMatch[];
  summary: string;
  nextPageToken?: string;
  totalCount?: number;
  currentBatch: number;
  hasMore: boolean;
  totalEmailsProcessed?: number;
  validEmailsForSearch?: number;
  batchSize?: number;
  batchMatches?: number;
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

export interface EmailSummary {
  summary: string;
  keyPoints: string[];
  actionItems?: string[];
  sentiment: "positive" | "negative" | "neutral";
  urgencyLevel: "low" | "medium" | "high";
  emailCount: number;
  dateRange?: string;
  topSenders?: string[];
  urgentEmails?: string[];
}

export interface SummaryOptions {
  maxLength?: number;
  focusAreas?: string[];
  tone?: "professional" | "casual" | "technical";
  includeKeyPoints?: boolean;
  includeActionItems?: boolean;
}

export interface SummaryResult {
  summary: string;
  keyPoints: string[];
  actionItems?: string[];
  sentiment?: "positive" | "negative" | "neutral";
  urgencyLevel?: "low" | "medium" | "high";
}

export interface EmailSummaryOptions extends SummaryOptions {
  includeContacts?: boolean;
  groupByThread?: boolean;
  prioritizeRecent?: boolean;
}

export interface EmailSummaryResult extends SummaryResult {
  emailCount: number;
  dateRange?: string;
  topSenders?: string[];
  commonTopics?: string[];
  urgentEmails?: string[];
}

export type GmailCategory = {
  id: string;
  label: string;
  icon: React.ReactNode;
  query?: string;
  description?: string;
};

export type Category = "wise-write"| "easy-schedule" | "fancy-template" | "template-marketplace" | "all-mail" | "smart-search" | "important";

export interface CategoryState {
  selectedCategory: Category;
  setCategory: (category: Category) => void;
}

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  category: Category;
  badge?: React.ReactNode;
}

export interface MessagePreview {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
}

export type DraftState = {
  isDraft: boolean;
  setIsDraft: (isDraft: boolean) => void;
  draftMessage: string;
  setDraftMessage: (draftMessage: string) => void;
  draftSubject: string;
  setDraftSubject: (draftSubject: string) => void;
  recipient: string;
  setRecipient: (recipient: string) => void;
  date: string;
  setDate: (date: string) => void;
  showSchedule: boolean;
  setShowSchedule: (showSchedule: boolean) => void;
  selectedTemplate: { id: number; name: string; html: string; prompt: string; created_at: string; } | null;
  setSelectedTemplate: (selectedTemplate: { id: number; name: string; html: string; prompt: string; created_at: string; } | null) => void;
  isGraphicMessage: boolean;
  setIsGraphicMessage: (isGraphicMessage: boolean) => void;
}
