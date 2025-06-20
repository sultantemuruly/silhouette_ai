import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export const Loader = ({
  loadingText,
  additionalStyles,
  compact = false,
}: {
  loadingText: string | null;
  additionalStyles: string | null;
  compact?: boolean;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center space-y-3",
        !compact && "h-48"
      )}
    >
      <Loader2
        className={cn("animate-spin h-6 w-6 text-primary", additionalStyles)}
      />
      {loadingText && (
        <p className="text-sm text-muted-foreground">{loadingText}</p>
      )}
    </div>
  );
};
