import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface EmailModalProps {
  open: boolean;
  onClose: () => void;
  status: 'pending' | 'sent' | 'failed';
  editMode: boolean;
  editFields: { subject: string; recipient: string; content: string; scheduled_date: string };
  onEditChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onEdit: () => void;
  onDelete: () => void;
  onEditMode: (v: boolean) => void;
  onCancelEdit: () => void;
}

const EmailModal: React.FC<EmailModalProps> = ({
  open,
  onClose,
  status,
  editMode,
  editFields,
  onEditChange,
  onEdit,
  onDelete,
  onEditMode,
  onCancelEdit,
}) => {
  const isPending = status === 'pending';
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
              name="subject"
              className="w-full border rounded px-3 py-2 text-sm"
              value={editFields.subject}
              onChange={onEditChange}
              readOnly={!isPending || !editMode}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Recipient</label>
            <input
              type="text"
              name="recipient"
              className="w-full border rounded px-3 py-2 text-sm"
              value={editFields.recipient}
              onChange={onEditChange}
              readOnly={!isPending || !editMode}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type={editMode && isPending ? 'datetime-local' : 'text'}
              name="scheduled_date"
              className="w-full border rounded px-3 py-2 text-sm"
              value={editMode && isPending ? editFields.scheduled_date.slice(0, 16) : new Date(editFields.scheduled_date).toLocaleString()}
              onChange={onEditChange}
              readOnly={!isPending || !editMode}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Content</label>
            <textarea
              name="content"
              className="w-full border rounded px-3 py-2 text-sm min-h-[100px] resize-none"
              value={editFields.content}
              onChange={onEditChange}
              readOnly={!isPending || !editMode}
            />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              status === 'sent' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
            {isPending && !editMode && (
              <>
                <Button variant="regular" size="sm" onClick={() => onEditMode(true)}>Edit</Button>
                <Button variant="destructive" size="sm" onClick={onDelete}>Delete</Button>
              </>
            )}
            {isPending && editMode && (
              <>
                <Button variant="regular" size="sm" onClick={onEdit}>Save</Button>
                <Button variant="outline" size="sm" onClick={onCancelEdit}>Cancel</Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailModal;
