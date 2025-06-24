import React from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
      {/* Center modal with padding */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-3xl overflow-hidden">
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

          <DialogContent className="p-6 max-h-[70vh] overflow-auto">
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
          </DialogContent>

          <DialogFooter className="p-6 border-t flex justify-end">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </div>
      </div>
    </Dialog>
  );
}
