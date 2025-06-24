import React from "react";
import { format } from "date-fns";
import { Mail } from "lucide-react";
import { EmailData } from "@/types";

type Props = {
  messages: EmailData[];
  onEmailSelect: (email: EmailData) => void;
};

export function EmailPreviewList({ messages, onEmailSelect }: Props) {
  return (
    <ul className="divide-y divide-border/50">
      {messages.map((email) => (
        <li
          key={email.id}
          className="px-4 py-4 hover:bg-blue-200/10 transition-colors cursor-pointer group border-l-4 border-l-transparent hover:border-l-blue-600/70"
          onClick={() => onEmailSelect(email)}
        >
          <div className="flex gap-3 items-start">
            <div className="p-2 rounded-full mt-1 flex-shrink-0 transition-colors bg-primary/10 group-hover:bg-blue-600/10 hover:text-blue-600">
              <Mail className="h-4 w-4 text-primary group-hover:text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2 mb-2">
                <h3 className="font-medium truncate text-foreground leading-tight group-hover:text-primary transition-colors">
                  {email.subject || "(No subject)"}
                </h3>
                <time className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                  {email.date && !isNaN(new Date(email.date).getTime())
                    ? format(new Date(email.date), "MMM d")
                    : "No date"}
                </time>
              </div>
              <p className="text-sm text-primary/80 truncate mb-1">
                {email.from}
              </p>
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {email.snippet}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
