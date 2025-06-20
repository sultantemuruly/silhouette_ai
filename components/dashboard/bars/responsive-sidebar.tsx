"use client";

import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./sidebar";
import { Menu } from "lucide-react";

export function ResponsiveSidebar() {
  return (
    <>
      {/* Mobile: hamburger trigger */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="md:hidden absolute top-4 left-4 z-20"
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-3/4 max-w-xs p-0 md:hidden">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Desktop: stick below a 4 rem Navbar (top-16) */}
      <div className="hidden md:block sticky top-16 self-start">
        <Sidebar />
      </div>
    </>
  );
}
