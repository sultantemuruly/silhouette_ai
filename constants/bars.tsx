import { NavItem } from "@/types";
import { Inbox, Star, Search, PenLine } from "lucide-react";

export const navItems: NavItem[] = [
  {
    label: "Wise Write",
    href: "/mail/write",
    category: "write",
    icon: <PenLine className="h-5 w-5" />,
    badge: (
      <span className="ml-auto text-xs font-medium text-yellow-600">🖊️</span>
    ),
  },
  {
    label: "All Mail",
    href: "/mail/all",
    category: "all-mail",
    icon: <Inbox className="h-5 w-5" />,
  },
  {
    label: "Smart Search",
    href: "/mail/smart-search",
    category: "smart-search",
    icon: <Search className="h-5 w-5" />,
    badge: <span className="ml-auto text-xs font-medium text-black">🔍</span>,
  },
  {
    label: "Important",
    href: "/mail/important",
    category: "important",
    icon: <Star className="h-5 w-5" />,
    badge: (
      <span className="ml-auto text-xs font-medium text-yellow-600">⭐</span>
    ),
  }
];
