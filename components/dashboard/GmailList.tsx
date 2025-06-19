"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Mail,
  Send,
  Trash2,
  FileText,
  Star,
  AlertTriangle,
  Archive,
  Clock,
  Flag,
  MessageCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import EmailViewModal from "./EmailViewModal";

export type Email = {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  body: string;
  date: string;
};

type GmailCategory = {
  id: string;
  label: string;
  icon: React.ReactNode;
  query?: string;
  description?: string;
};

const GMAIL_CATEGORIES: GmailCategory[] = [
  {
    id: "inbox",
    label: "Inbox",
    icon: <Mail className="h-4 w-4" />,
    query: "in:inbox",
    description: "Your main inbox messages",
  },
  {
    id: "important",
    label: "Important",
    icon: <Flag className="h-4 w-4" />,
    query: "is:important",
    description: "Messages marked as important",
  },
  {
    id: "snoozed",
    label: "Snoozed",
    icon: <Clock className="h-4 w-4" />,
    query: "in:snoozed",
    description: "Messages you've snoozed",
  },
  {
    id: "starred",
    label: "Starred",
    icon: <Star className="h-4 w-4" />,
    query: "is:starred",
    description: "Messages you've starred",
  },
  {
    id: "sent",
    label: "Sent",
    icon: <Send className="h-4 w-4" />,
    query: "in:sent",
    description: "Messages you've sent",
  },
  {
    id: "drafts",
    label: "Drafts",
    icon: <FileText className="h-4 w-4" />,
    query: "in:drafts",
    description: "Your draft messages",
  },
  {
    id: "chats",
    label: "Chats",
    icon: <MessageCircle className="h-4 w-4" />,
    query: "in:chats",
    description: "Chat conversations",
  },
  {
    id: "spam",
    label: "Spam",
    icon: <AlertTriangle className="h-4 w-4" />,
    query: "in:spam",
    description: "Spam messages",
  },
  {
    id: "trash",
    label: "Trash",
    icon: <Trash2 className="h-4 w-4" />,
    query: "in:trash",
    description: "Deleted messages",
  },
  {
    id: "all",
    label: "All Mail",
    icon: <Archive className="h-4 w-4" />,
    query: "in:all",
    description: "All your messages",
  },
];

export function GmailList() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("inbox");

  async function fetchPage(token?: string, category?: string) {
    try {
      setLoading(true);
      const url = new URL("/api/gmail/messages", window.location.origin);
      if (token) url.searchParams.set("pageToken", token);
      if (category && category !== "inbox") {
        url.searchParams.set("category", category);
      }

      const res = await fetch(url.toString());
      if (res.status === 401) {
        window.location.href = "/sign-in";
        return;
      }
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API ${res.status}: ${text}`);
      }

      const { messages, nextPageToken: next } = await res.json();
      setEmails((prev) => (token ? [...prev, ...messages] : messages));
      setNextPageToken(next);
    } catch (err) {
      console.error(err);
      setError("Failed to load emails.");
    } finally {
      setLoading(false);
    }
  }

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    setEmails([]);
    setNextPageToken(null);
    setError(null);
    fetchPage(undefined, categoryId);
  };

  useEffect(() => {
    fetchPage();
  }, []);

  const currentCategory =
    GMAIL_CATEGORIES.find((cat) => cat.id === activeCategory) ||
    GMAIL_CATEGORIES[0];

  const getEmptyStateMessage = (categoryId: string) => {
    const messages: Record<string, { title: string; description: string }> = {
      inbox: {
        title: "Your inbox is empty",
        description: "No new messages to read",
      },
      important: {
        title: "No important messages",
        description: "Messages marked as important will appear here",
      },
      snoozed: {
        title: "No snoozed messages",
        description: "Messages you snooze will appear here until it's time",
      },
      starred: {
        title: "No starred messages",
        description: "Star messages to find them easily later",
      },
      sent: {
        title: "No sent messages",
        description: "Messages you send will appear here",
      },
      drafts: {
        title: "No draft messages",
        description: "Save drafts to continue writing later",
      },
      chats: {
        title: "No chat messages",
        description: "Your Google Chat conversations will appear here",
      },
      spam: {
        title: "No spam messages",
        description: "Suspicious messages are automatically moved here",
      },
      trash: {
        title: "Trash is empty",
        description: "Deleted messages will appear here for 30 days",
      },
      all: {
        title: "No messages found",
        description: "All your messages from every folder would appear here",
      },
    };
    return messages[categoryId] || messages.inbox;
  };

  return (
    <>
      <Card className="w-full max-w-6xl mx-auto shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col space-y-4">
            {/* Header with title and email count */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    activeCategory === "important" &&
                      "bg-amber-100 text-amber-700",
                    activeCategory === "snoozed" && "bg-blue-100 text-blue-700",
                    activeCategory === "starred" &&
                      "bg-yellow-100 text-yellow-700",
                    activeCategory === "chats" && "bg-green-100 text-green-700",
                    activeCategory === "spam" && "bg-red-100 text-red-700",
                    activeCategory === "trash" && "bg-gray-100 text-gray-700",
                    ![
                      "important",
                      "snoozed",
                      "starred",
                      "chats",
                      "spam",
                      "trash",
                    ].includes(activeCategory) && "bg-primary/10 text-primary"
                  )}
                >
                  {currentCategory.icon}
                </div>
                <div>
                  <CardTitle className="text-2xl">
                    {currentCategory.label}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {currentCategory.description}
                  </p>
                </div>
              </div>
              {emails.length > 0 && (
                <Badge variant="secondary" className="hidden sm:flex">
                  {emails.length} {emails.length === 1 ? "email" : "emails"}
                </Badge>
              )}
            </div>

            {/* Category Navigation */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2">
              {GMAIL_CATEGORIES.map((category) => (
                <Button
                  key={category.id}
                  variant={
                    activeCategory === category.id ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => handleCategoryChange(category.id)}
                  disabled={loading}
                  className={cn(
                    "flex items-center justify-center space-x-2 transition-all duration-200 min-h-[2.5rem]",
                    activeCategory === category.id
                      ? "shadow-md scale-105"
                      : "hover:shadow-sm hover:scale-102",
                    // Special colors for certain categories
                    activeCategory === category.id &&
                      category.id === "important" &&
                      "bg-amber-500 hover:bg-amber-600",
                    activeCategory === category.id &&
                      category.id === "snoozed" &&
                      "bg-blue-500 hover:bg-blue-600",
                    activeCategory === category.id &&
                      category.id === "chats" &&
                      "bg-green-500 hover:bg-green-600",
                    activeCategory === category.id &&
                      category.id === "spam" &&
                      "bg-red-500 hover:bg-red-600"
                  )}
                  title={category.description}
                >
                  {category.icon}
                  <span className="hidden sm:inline text-xs lg:text-sm truncate">
                    {category.label}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="p-0">
          {loading && !emails.length ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-3">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading {currentCategory.label.toLowerCase()}...
              </p>
            </div>
          ) : error ? (
            <div className="p-6 text-center space-y-3">
              <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />
              <p className="text-red-600 font-medium">{error}</p>
              <Button
                variant="outline"
                onClick={() => fetchPage(undefined, activeCategory)}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          ) : !emails.length ? (
            <div className="p-8 text-center space-y-4">
              <div
                className={cn(
                  "rounded-full p-4 w-fit mx-auto",
                  activeCategory === "important" && "bg-amber-100",
                  activeCategory === "snoozed" && "bg-blue-100",
                  activeCategory === "starred" && "bg-yellow-100",
                  activeCategory === "chats" && "bg-green-100",
                  activeCategory === "spam" && "bg-red-100",
                  activeCategory === "trash" && "bg-gray-100",
                  ![
                    "important",
                    "snoozed",
                    "starred",
                    "chats",
                    "spam",
                    "trash",
                  ].includes(activeCategory) && "bg-muted/50"
                )}
              >
                <div
                  className={cn(
                    "h-8 w-8",
                    activeCategory === "important" && "text-amber-600",
                    activeCategory === "snoozed" && "text-blue-600",
                    activeCategory === "starred" && "text-yellow-600",
                    activeCategory === "chats" && "text-green-600",
                    activeCategory === "spam" && "text-red-600",
                    activeCategory === "trash" && "text-gray-600",
                    ![
                      "important",
                      "snoozed",
                      "starred",
                      "chats",
                      "spam",
                      "trash",
                    ].includes(activeCategory) && "text-muted-foreground"
                  )}
                >
                  {currentCategory.icon}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium text-muted-foreground">
                  {getEmptyStateMessage(activeCategory).title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {getEmptyStateMessage(activeCategory).description}
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <ul className="divide-y divide-border/50">
                {emails.map((mail) => (
                  <li
                    key={mail.id}
                    className={cn(
                      "px-4 py-4 hover:bg-muted/50 transition-colors cursor-pointer group",
                      "border-l-4 border-l-transparent hover:border-l-primary/30"
                    )}
                    onClick={() => setSelectedEmail(mail)}
                  >
                    <div className="flex gap-3 items-start">
                      <div
                        className={cn(
                          "p-2 rounded-full mt-1 flex-shrink-0 transition-colors",
                          "bg-primary/10 group-hover:bg-primary/20"
                        )}
                      >
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h3 className="font-medium truncate text-foreground leading-tight group-hover:text-primary transition-colors">
                            {mail.subject || "(No subject)"}
                          </h3>
                          <time className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                            {format(new Date(mail.date), "MMM d")}
                          </time>
                        </div>
                        <p className="text-sm text-primary/80 truncate mb-1">
                          {mail.from}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {mail.snippet}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>

        {nextPageToken && (
          <CardFooter className="border-t py-4">
            <Button
              onClick={() => fetchPage(nextPageToken, activeCategory)}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading more...
                </>
              ) : (
                `Load more ${currentCategory.label.toLowerCase()}`
              )}
            </Button>
          </CardFooter>
        )}
      </Card>

      <EmailViewModal
        email={selectedEmail}
        onClose={() => setSelectedEmail(null)}
      />
    </>
  );
}
