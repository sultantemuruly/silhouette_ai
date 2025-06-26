"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 flex h-16 items-center justify-between">
        {/* Logo (hidden on mobile, but keep space) */}
        <div className="flex-1 md:flex-none">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity hidden md:inline"
          >
            Silhouette AI
          </Link>
        </div>

        {/* User Button */}
        <UserButton />
      </div>
    </header>
  );
}
