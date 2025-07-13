import { NavItem } from "@/types";
import {
  Inbox,
  Star,
  Search,
  PenLine,
  Calendar,
  LayoutTemplate,
  ShoppingBag,
} from "lucide-react";

// export const navItemsActive: NavItem[] = [
//   {
//     label: "Wise Write",
//     href: "/mail/write",
//     category: "wise-write",
//     icon: <PenLine className="h-5 w-5" />,
//     badge: (
//       <span className="ml-auto text-xs font-medium text-yellow-600">🖊️</span>
//     ),
//   },
//   {
//     label: "Easy Schedule",
//     href: "/mail/schedule",
//     category: "easy-schedule",
//     icon: <Calendar className="h-5 w-5" />,
//     badge: <span className="ml-auto text-xs font-medium text-black">🕒</span>,
//   },
//   {
//     label: "Fancy Template",
//     href: "/mail/template",
//     category: "fancy-template",
//     icon: < LayoutTemplate className="h-5 w-5" />,
//     badge: (
//       <span className="ml-auto text-xs font-medium text-yellow-600">🎨</span>
//     ),
//   }
// ];

// export const navItemsComingSoon: NavItem[] = [
//   {
//     label: "All Mail",
//     href: "/mail/all",
//     category: "all-mail",
//     icon: <Inbox className="h-5 w-5" />,
//     badge: (
//       <span className="ml-auto text-xs font-medium text-yellow-600">📧</span>
//     ),
//   },
//   {
//     label: "Smart Search",
//     href: "/mail/smart-search",
//     category: "smart-search",
//     icon: <Search className="h-5 w-5" />,
//     badge: <span className="ml-auto text-xs font-medium text-black">🔍</span>,
//   },
//   {
//     label: "Important",
//     href: "/mail/important",
//     category: "important",
//     icon: <Star className="h-5 w-5" />,
//     badge: (
//       <span className="ml-auto text-xs font-medium text-yellow-600">⭐</span>
//     ),
//   }
// ];

export const navItemsActive: NavItem[] = [
  {
    label: "Fancy Template",
    href: "/mail/template",
    category: "fancy-template",
    icon: (
      // <span className="ml-auto text-xs font-medium text-yellow-600">🖼️</span>
      <LayoutTemplate />
    ),
  },
  {
    label: "Template Marketplace",
    href: "/mail/marketplace",
    category: "template-marketplace",
    icon: (
      // <span className="ml-auto text-xs font-medium text-yellow-600">🛍️</span>
      <ShoppingBag />
    ),
  },
  {
    label: "Wise Write",
    href: "/mail/write",
    category: "wise-write",
    icon: (
      // <span className="ml-auto text-xs font-medium text-yellow-600">✍</span>
      <PenLine />
    ),
  },
  {
    label: "Easy Schedule",
    href: "/mail/schedule",
    category: "easy-schedule",
    icon: (
      // <span className="ml-auto text-xs font-medium text-black">📅</span>
      <Calendar />
    ),
  },
];

export const navItemsComingSoon: NavItem[] = [
  {
    label: "All Mail",
    href: "/mail/all",
    category: "all-mail",
    icon: (
      //  <span className="ml-auto text-xs font-medium text-yellow-600">📫</span>
      <Inbox />
    ),
  },
  {
    label: "Smart Search",
    href: "/mail/smart-search",
    category: "smart-search",
    icon: (
      // <span className="ml-auto text-xs font-medium text-black">🔍</span>
      <Search />
    ),
  },
  {
    label: "Important",
    href: "/mail/important",
    category: "important",
    icon: (
      // <span className="ml-auto text-xs font-medium text-yellow-600">❗</span>
      <Star />
    ),
  },
];
