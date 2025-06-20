"use client";

import { cn } from "@/lib/utils";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus } from "lucide-react";

import { useCategoryStore } from "@/stores/useCategoryStore";
import { navItems } from "@/constants/bars";

export function Sidebar() {
  const setCategory = useCategoryStore((state) => state.setCategory);
  const selectedCategory = useCategoryStore((state) => state.selectedCategory);

  return (
    <aside className="w-64 h-screen border-r bg-white">
      <ScrollArea className="h-full px-4 py-6">
        {/* Main nav */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Button
              key={item.href}
              onClick={() => {
                setCategory(item.category);
              }}
              className={cn("flex items-center px-3 py-2 rounded-md")}
              variant={selectedCategory === item.category ? `regular` : `ghost`}
            >
              {item.icon}
              <span className="ml-3 text-sm font-medium">{item.label}</span>
              {item.badge}
            </Button>
          ))}
        </nav>

        <Separator className="my-4" />
        {/* Custom filters */}
        <div className="mt-2">
          <h6 className="px-3 mb-2 text-xs font-semibold uppercase text-gray-500">
            Custom
          </h6>
          <Button variant="outline" size="sm" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Filter
          </Button>
        </div>
      </ScrollArea>
    </aside>
  );
}
