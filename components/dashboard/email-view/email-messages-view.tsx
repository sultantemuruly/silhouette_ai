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
import { Separator } from "@/components/ui/separator";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Loader } from "../../ui/loader";
import { cn } from "@/lib/utils";

import EmailViewModal from "./email-view-modal";
import EmailPreviewList from "./email-preview-list";

import { Email } from "@/types";
import { GMAIL_CATEGORIES } from "@/constants/gmail-categories";
import { EMPTY_MESSAGES, CATEGORY_COLORS } from "@/constants";

export function EmailMessagesView() {
  const [messages, setMessages] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openEmail, setOpenEmail] = useState<Email | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("inbox");

  const categoryStyles = CATEGORY_COLORS[activeCategory] || {};
  const currentCategory =
    GMAIL_CATEGORIES.find((cat) => cat.id === activeCategory) ||
    GMAIL_CATEGORIES[0];

  async function fetchPage(token?: string, category?: string) {
    try {
      setLoading(true);
      const url = new URL("/api/gmail/messages", window.location.origin);
      if (token) url.searchParams.set("pageToken", token);
      if (category && category !== "inbox")
        url.searchParams.set("category", category);

      const res = await fetch(url.toString());
      if (res.status === 401) {
        window.location.href = "/sign-in";
        return;
      }
      if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);

      const { messages, nextPageToken: next } = await res.json();
      setMessages((prev) => (token ? [...prev, ...messages] : messages));
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
    setMessages([]);
    setNextPageToken(null);
    setError(null);
    fetchPage(undefined, categoryId);
  };

  useEffect(() => {
    fetchPage();
  }, []);

  const getEmptyStateMessage = (categoryId: string) => {
    return EMPTY_MESSAGES[categoryId] || EMPTY_MESSAGES.inbox;
  };

  return (
    <>
      <Card className="w-full max-w-6xl mx-auto shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    categoryStyles.bg || "bg-primary/10",
                    categoryStyles.text || "text-primary"
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
              {messages.length > 0 && (
                <Badge variant="secondary" className="hidden sm:flex">
                  {messages.length} {messages.length === 1 ? "email" : "emails"}
                </Badge>
              )}
            </div>

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
                      ? "shadow-md scale-110 bg-blue-600 hover:bg-blue-700 hover:text-white hover:scale-112"
                      : "hover:shadow-sm hover:scale-102"
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
          {loading && !messages.length ? (
            <Loader
              loadingText={`Loading ${currentCategory.label.toLowerCase()}...`}
            />
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
          ) : !messages.length ? (
            <div className="p-8 text-center space-y-4">
              <div
                className={cn(
                  "rounded-full p-4 w-fit mx-auto",
                  categoryStyles.emptyBg || "bg-muted/50"
                )}
              >
                <div
                  className={cn(
                    "h-8 w-8",
                    categoryStyles.iconColor || "text-muted-foreground"
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
            <EmailPreviewList
              messages={messages}
              onEmailSelect={setOpenEmail}
            />
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
                <Loader loadingText={`Loading more...`} />
              ) : (
                `Load more ${currentCategory.label.toLowerCase()}`
              )}
            </Button>
          </CardFooter>
        )}
      </Card>

      <EmailViewModal email={openEmail} onClose={() => setOpenEmail(null)} />
    </>
  );
}
