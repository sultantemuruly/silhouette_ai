export const EMPTY_MESSAGES: Record<
  string,
  { title: string; description: string }
> = {
  inbox: {
    title: "Your inbox is empty",
    description: "No new messages to read",
  },
  important: {
    title: "No important messages",
    description: "Messages marked as important will appear here",
  },
  snoozed: {
    title: "No snoozed messages",
    description: "Messages you snooze will appear here until it's time",
  },
  starred: {
    title: "No starred messages",
    description: "Star messages to find them easily later",
  },
  sent: {
    title: "No sent messages",
    description: "Messages you send will appear here",
  },
  drafts: {
    title: "No draft messages",
    description: "Save drafts to continue writing later",
  },
  chats: {
    title: "No chat messages",
    description: "Your Google Chat conversations will appear here",
  },
  spam: {
    title: "No spam messages",
    description: "Suspicious messages are automatically moved here",
  },
  trash: {
    title: "Trash is empty",
    description: "Deleted messages will appear here for 30 days",
  },
  all: {
    title: "No messages found",
    description: "All your messages from every folder would appear here",
  },
};

export const CATEGORY_COLORS: Record<
  string,
  {
    bg?: string;
    text?: string;
    iconColor?: string;
    emptyBg?: string;
  }
> = {
  inbox: {
    bg: "bg-primary/10",
    text: "text-primary",
    iconColor: "text-muted-foreground",
    emptyBg: "bg-muted/50",
  },
  important: {
    bg: "bg-amber-500 hover:bg-amber-600",
    text: "text-white",
    iconColor: "text-amber-600",
    emptyBg: "bg-amber-100",
  },
  snoozed: {
    bg: "bg-blue-500 hover:bg-blue-600",
    text: "text-white",
    iconColor: "text-blue-600",
    emptyBg: "bg-blue-100",
  },
  starred: {
    iconColor: "text-yellow-600",
    emptyBg: "bg-yellow-100",
  },
  chats: {
    bg: "bg-green-500 hover:bg-green-600",
    text: "text-white",
    iconColor: "text-green-600",
    emptyBg: "bg-green-100",
  },
  spam: {
    bg: "bg-red-500 hover:bg-red-600",
    text: "text-white",
    iconColor: "text-red-600",
    emptyBg: "bg-red-100",
  },
  trash: {
    iconColor: "text-gray-600",
    emptyBg: "bg-gray-100",
  },
};
