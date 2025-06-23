import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmailData } from "@/types";

import { format } from "date-fns";

export function EmailViewModal({
  email,
  onClose,
}: {
  email: EmailData | null;
  onClose: () => void;
}) {
  if (!email) return null;

  return (
    <Dialog open={!!email} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full sm:max-w-5xl max-h-[90vh] flex flex-col px-4 sm:px-8">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl">{email.subject}</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-4 overflow-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div>
              <p className="font-medium text-primary">{email.from}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {format(new Date(email.date), "PPpp")}
              </p>
            </div>
          </div>
          <Separator />
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: email.body }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
