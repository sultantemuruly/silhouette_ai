import { NavItem } from "@/types";
import { Inbox, Star, Search } from "lucide-react";

export const navItems: NavItem[] = [
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
  },
];
