import React from 'react';
import { Dialog } from '@/components/ui/dialog';

interface EmailTemplateModalProps {
  open: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

export const EmailTemplateModal = ({ open, onClose, children }: EmailTemplateModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <div className="p-6 bg-white rounded shadow-lg min-w-[400px]">
        {children}
      </div>
    </Dialog>
  );
};