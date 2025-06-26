"use client";

import { useState } from "react";
import { Toggle } from "../ui/toggle";
import { Button } from "../ui/button";
import { Menu, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClerk, UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { openSignIn, openSignUp } = useClerk();
  const router = useRouter();

  const handleLoginClick = () => openSignIn();
  const handleSignUpClick = () => openSignUp();

  const handleDashboardNav = () => {
    router.push("/dashboard");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 flex h-16 items-center justify-between">
        {/* Logo + Nav */}
        <div className="flex items-center gap-6 md:gap-10">
          <span className="text-2xl font-bold tracking-tight hidden md:inline">
            Silhouette AI
          </span>

          <nav className="hidden md:flex gap-6">
            <a
              href="#features"
              className="text-sm font-medium hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium hover:text-foreground transition-colors"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium hover:text-foreground transition-colors"
            >
              Pricing
            </a>
          </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Toggle />

          {/* Desktop Auth Buttons / User Button */}
          <div className="hidden md:flex items-center gap-4">
            <SignedIn>
              <div className="flex gap-4">
                <Button
                  variant="regular"
                  className="group"
                  onClick={handleDashboardNav}
                >
                  Dashboard
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <UserButton />
              </div>
            </SignedIn>
            <SignedOut>
              <Button variant="outline" onClick={handleLoginClick}>
                Log In
              </Button>
              <Button variant="regular" onClick={handleSignUpClick}>
                Get Started
              </Button>
            </SignedOut>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="block md:hidden"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <div
        className={cn(
          "md:hidden overflow-hidden border-t bg-background transition-all duration-300 ease-in-out",
          isMenuOpen
            ? "max-h-screen opacity-100 py-4"
            : "max-h-0 opacity-0 py-0"
        )}
      >
        <div className="mx-auto max-w-7xl px-4">
          <nav className="flex flex-col gap-4">
            <a
              href="#features"
              className="text-sm font-medium hover:text-foreground transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium hover:text-foreground transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              How It Works
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium hover:text-foreground transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </a>

            {/* Mobile Auth Buttons / User Button */}
            <div className="flex flex-col gap-2 pt-4">
              <SignedIn>
                <div className="flex flex-col gap-4">
                  <Button
                    variant="regular"
                    className="group"
                    onClick={handleDashboardNav}
                  >
                    Dashboard
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                  <UserButton />
                </div>
              </SignedIn>
              <SignedOut>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleLoginClick}
                >
                  Log In
                </Button>
                <Button
                  variant="regular"
                  className="w-full"
                  onClick={handleSignUpClick}
                >
                  Get Started
                </Button>
              </SignedOut>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
