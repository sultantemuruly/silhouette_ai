import React from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
} from "@/components/ui/dialog";
import type { EmailData } from "@/types";
import { Loader } from "@/components/ui/loader";

interface EmailViewModalProps {
  preview: EmailData | null;
  email: EmailData | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}

export function EmailViewModal({
  preview,
  email,
  loading,
  error,
  onClose,
}: EmailViewModalProps) {
  if (!preview) return null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="text-lg font-semibold">
            {loading ? "Loading…" : email?.subject || preview.subject}
          </DialogTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {preview.from} —{" "}
            {loading
              ? ""
              : new Date(email?.date || preview.date).toLocaleString()}
          </p>
        </DialogHeader>
        <div className="p-6 max-h-[70vh] overflow-auto">
          {loading ? (
            <Loader loadingText="Fetching email…" additionalStyles={null} />
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : (
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: email?.body || "" }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
