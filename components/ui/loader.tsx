import { Loader2 } from "lucide-react";

export const Loader = ({ loadingText }: { loadingText: string | null }) => {
  return (
    <div className="flex flex-col items-center justify-center h-48 space-y-3">
      <Loader2 className="animate-spin h-8 w-8 text-primary" />
      {loadingText ?? (
        <p className="text-sm text-muted-foreground">{loadingText}</p>
      )}
    </div>
  );
};
