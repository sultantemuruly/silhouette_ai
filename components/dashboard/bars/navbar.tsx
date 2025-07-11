"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Bell } from "lucide-react";
import { useCategoryStore } from "@/stores/useCategoryStore";
import { navItemsActive, navItemsComingSoon } from "@/constants/bars";

export function Navbar() {
  const selectedCategory = useCategoryStore((state) => state.selectedCategory);
  // Find the label for the current category
  const allNavItems = [...navItemsActive, ...navItemsComingSoon];
  const currentNav = allNavItems.find((item) => item.category === selectedCategory);
  const pageTitle = currentNav ? currentNav.label : "Dashboard";

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 flex h-16 items-center justify-between">
        {/* Logo (always visible) */}
        <div className="flex-1 flex items-center">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity"
          >
            Silhouette AI
          </Link>
        </div>

        {/* Center: Page Title */}
        <div className="flex-1 flex justify-center">
          <span className="text-lg font-semibold text-gray-700 dark:text-gray-200 truncate max-w-xs text-center">
            {pageTitle}
          </span>
        </div>

        {/* Right: Notification Bell & User Button */}
        <div className="flex-1 flex items-center justify-end gap-4">
          {/* Notification Bell (icon only, no logic) */}
          <button
            aria-label="Notifications"
            className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            tabIndex={0}
            type="button"
          >
            <Bell className="h-6 w-6 text-gray-500 dark:text-gray-300" />
          </button>
        <UserButton />
        </div>
      </div>
    </header>
  );
}
