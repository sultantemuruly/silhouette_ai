import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { format } from "date-fns";

export type Email = {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  body: string;
  date: string;
};

function EmailViewModal({
  email,
  onClose,
}: {
  email: Email | null;
  onClose: () => void;
}) {
  if (!email) return null;

  return (
    <Dialog open={!!email} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl">{email.subject}</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-4 overflow-auto">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-primary">{email.from}</p>
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

export default EmailViewModal;
