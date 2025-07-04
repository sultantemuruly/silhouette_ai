import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface EmailModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  recipient: string;
  content: string;
  date: string;
}

const EmailModal: React.FC<EmailModalProps> = ({ open, onClose, title, recipient, content, date }) => {
  return (
    <Dialog open={open} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>Email Details</DialogTitle>
          <DialogDescription>View or edit the scheduled email details below.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 text-sm"
              value={title}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Recipient</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 text-sm"
              value={recipient}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 text-sm"
              value={new Date(date).toLocaleString()}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Content</label>
            <textarea
              className="w-full border rounded px-3 py-2 text-sm min-h-[100px] resize-none"
              value={content}
              readOnly
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailModal;
