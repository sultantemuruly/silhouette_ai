"use client";

import { Navbar } from "@/components/dashboard/bars/navbar";
import { ResponsiveSidebar } from "@/components/dashboard/bars/responsive-sidebar";

import EmailAllView from "@/components/dashboard/email-view/email-all-view";
import EmailSearch from "@/components/dashboard/email-search/email-search";

import { useCategoryStore } from "@/stores/useCategoryStore";
import { Category } from "@/types";

const categoryComponents: Record<Category, React.ReactNode> = {
  "all-mail": <EmailAllView />,
  "smart-search": <EmailSearch />,
  important: undefined,
  // add more in future
};

export default function Dashboard() {
  const selectedCategory = useCategoryStore((state) => state.selectedCategory);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        {/* Left: sidebar */}
        <ResponsiveSidebar />

        {/* Right: main content (grows to fill) */}
        <main className="flex-1 overflow-auto p-4">
          {categoryComponents[selectedCategory] ?? <div>Not found</div>}
        </main>
      </div>
    </div>
  );
}
