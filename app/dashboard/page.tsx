"use client";

import { Navbar } from "@/components/dashboard/bars/navbar";
import { ResponsiveSidebar } from "@/components/dashboard/bars/responsive-sidebar";

import EmailAllView from "@/components/dashboard/email-view/email-all-view";
import EmailSearch from "@/components/dashboard/email-search/email-search";
import EmailImportantMessages from "@/components/dashboard/email-important/email-important-messages";
// import ComingSoon from "@/components/dashboard/coming-soon";
import EmailWrite from "@/components/dashboard/email-write/email-write";
import EmailSchedule from "@/components/dashboard/email-schedule/email-schedule";
import EmailTemplate from "@/components/dashboard/email-template/email-template";

import { useCategoryStore } from "@/stores/useCategoryStore";
import { Category } from "@/types";
import { useEffect } from "react";

import { trackGtag } from "@/lib/gtag";

const categoryComponents: Record<Category, React.ReactNode> = {
  "wise-write": <EmailWrite />,
  "easy-schedule": <EmailSchedule />,
  "fancy-template": <EmailTemplate />,
  "all-mail": <EmailAllView />,
  "smart-search": <EmailSearch />,
  important: <EmailImportantMessages />,
  // add more in future
};

export default function Dashboard() {
  const selectedCategory = useCategoryStore((state) => state.selectedCategory);
  const setCategory = useCategoryStore((state) => state.setCategory);

  // Track dashboard view
  useEffect(() => {
    trackGtag('dashboard_view', 'dashboard');
  }, []);

  // Track sidebar category changes
  const handleCategoryChange = (category: string) => {
    trackGtag('sidebar_category_click', 'dashboard', category);
    setCategory(category as Category);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        {/* Left: sidebar */}
        <ResponsiveSidebar onCategoryChange={handleCategoryChange} />

        {/* Right: main content (grows to fill) */}
        <main className="flex-1 overflow-auto p-4">
          {categoryComponents[selectedCategory] ?? <div>Not found</div>}
        </main>
      </div>
    </div>
  );
}
