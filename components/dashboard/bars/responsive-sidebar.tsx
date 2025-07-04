"use client";

import { Sheet, SheetTrigger, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./sidebar";
import { Menu } from "lucide-react";

interface ResponsiveSidebarProps {
  onCategoryChange?: (category: string) => void;
}

export function ResponsiveSidebar({ onCategoryChange }: ResponsiveSidebarProps) {
  return (
    <>
      {/* Mobile: hamburger trigger */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="md:hidden fixed top-4 left-4 z-50"
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-3/4 max-w-xs p-0 md:hidden">
          <SheetTitle className="sr-only">Sidebar navigation</SheetTitle>
          <Sidebar onCategoryChange={onCategoryChange} />
        </SheetContent>
      </Sheet>

      {/* Desktop: stick below a 4 rem Navbar (top-16) */}
      <div className="hidden md:block sticky top-16 self-start">
        <Sidebar onCategoryChange={onCategoryChange} />
      </div>
    </>
  );
}
