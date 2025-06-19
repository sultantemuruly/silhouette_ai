"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  Inbox,
  Star,
  BookOpen,
  Briefcase,
  CreditCard,
  Plus,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: "All Mail",
    href: "/mail/all",
    icon: <Inbox className="h-5 w-5" />,
  },
  {
    label: "Important",
    href: "/mail/important",
    icon: <Star className="h-5 w-5" />,
    badge: (
      <span className="ml-auto text-xs font-medium text-yellow-600">⭐</span>
    ),
  },
];

const aiCategories: NavItem[] = [
  {
    label: "University",
    href: "/mail/university",
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    label: "Company",
    href: "/mail/company",
    icon: <Briefcase className="h-5 w-5" />,
  },
  {
    label: "Payments",
    href: "/mail/payments",
    icon: <CreditCard className="h-5 w-5" />,
  },
];

export function Sidebar() {
  return (
    <aside className="w-64 h-screen border-r bg-white">
      <ScrollArea className="h-full px-4 py-6">
        {/* Main nav */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center px-3 py-2 rounded-md hover:bg-gray-100"
            >
              {item.icon}
              <span className="ml-3 text-sm font-medium">{item.label}</span>
              {item.badge}
            </Link>
          ))}
        </nav>

        <Separator className="my-4" />

        {/* AI categories */}
        <nav className="space-y-1">
          {aiCategories.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center px-3 py-2 rounded-md hover:bg-gray-100"
            >
              {item.icon}
              <span className="ml-3 text-sm font-medium">{item.label}</span>
            </Link>
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
