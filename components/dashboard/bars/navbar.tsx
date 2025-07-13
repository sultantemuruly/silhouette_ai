"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { useCategoryStore } from "@/stores/useCategoryStore";
import { navItemsActive, navItemsComingSoon } from "@/constants/bars";

export function Navbar() {
  const selectedCategory = useCategoryStore((state) => state.selectedCategory);
  // Find the label for the current category
  const allNavItems = [...navItemsActive, ...navItemsComingSoon];
  const currentNav = allNavItems.find(
    (item) => item.category === selectedCategory
  );
  const pageTitle = currentNav ? currentNav.label : "Dashboard";

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 flex h-16 items-center justify-between">
        {/* Logo (always visible) */}
        <div className="flex-1 flex items-center pl-10 md:pl-4 lg:pl-0">
          <Link
            href="/"
            className="text-lg md:text-2xl font-medium md:font-bold tracking-tight hover:opacity-80 transition-opacity"
          >
            Silhouette AI
          </Link>
        </div>

        {/* Center: Page Title */}
        <div className="flex-1 flex justify-center">
          <span className="text-md md:text-lg font-normal md:font-semibold text-gray-800 dark:text-gray-200 truncate max-w-xs text-center">
            {pageTitle}
          </span>
        </div>

        {/* Right: User Button */}
        <div className="flex-1 flex items-center justify-end gap-4">
          <UserButton />
        </div>
      </div>
    </header>
  );
}
