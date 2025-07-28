"use client";

import { cn } from "@/lib/utils";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { HelpCircle } from "lucide-react";

import { useCategoryStore } from "@/stores/useCategoryStore";
import { navItemsActive, /* navItemsComingSoon */ } from "@/constants/bars";

interface SidebarProps {
  onCategoryChange?: (category: string) => void;
}

export function Sidebar({ onCategoryChange }: SidebarProps) {
  const setCategory = useCategoryStore((state) => state.setCategory);
  const selectedCategory = useCategoryStore((state) => state.selectedCategory);

  return (
    <aside className="w-64 h-screen border-r bg-white flex flex-col">
      <ScrollArea className="h-full px-4 py-6 flex-1">
        {/* Main nav */}
        <nav className="space-y-1">
          {navItemsActive.map((item) => (
            <Button
              key={item.href}
              onClick={() => {
                setCategory(item.category);
                if (onCategoryChange) onCategoryChange(item.category);
              }}
              className={cn(
                "flex items-center px-3 py-2 rounded-md relative group transition-colors",
                selectedCategory === item.category &&
                  "bg-blue-50 text-blue-700 font-semibold shadow-sm hover:bg-blue-600 hover:text-white"
              )}
              variant={selectedCategory === item.category ? `regular` : `ghost`}
              aria-current={selectedCategory === item.category ? "page" : undefined}
              tabIndex={0}
              type="button"
              title={item.label}
            >
              {/* Highlight bar for active item */}
              {selectedCategory === item.category && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-blue-600 rounded-r-md" />
              )}
              {item.icon}
              <span className="ml-3 text-sm font-medium">{item.label}</span>
              {item.badge}
            </Button>
          ))}

          <Separator className="my-4" />
          {/* <div className="text-sm font-medium">Coming Soon!</div>
          {navItemsComingSoon.map((item) => (
            <Button
              key={item.href}
              onClick={() => {
              setCategory(item.category);
              if (onCategoryChange) onCategoryChange(item.category);
              }}
              className={cn(
                "flex items-center px-3 py-2 rounded-md relative group transition-colors",
                selectedCategory === item.category &&
                  "bg-blue-50 text-blue-700 font-semibold shadow-sm hover:bg-blue-600 hover:text-white"
              )}
              variant={selectedCategory === item.category ? `regular` : `ghost`}
              title={item.label}
              tabIndex={0}
              type="button"
            >
              {item.icon}
              <span className="ml-3 text-sm font-medium">{item.label}</span>
              {item.badge}
            </Button>
          ))} */}
        </nav>
      </ScrollArea>
      {/* Settings/Help placeholder at the bottom */}
      <div className="p-4 border-t flex items-center justify-center">
        <button
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Help & Settings"
          tabIndex={0}
          type="button"
        >
          <HelpCircle className="h-5 w-5" />
          <span className="text-sm font-medium">Help & Settings</span>
        </button>
      </div>
    </aside>
  );
}
