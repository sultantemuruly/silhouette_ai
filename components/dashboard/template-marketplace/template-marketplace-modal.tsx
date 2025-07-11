import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface TemplateMarketplaceModalProps {
  open: boolean;
  onClose: () => void;
  name: string;
  html: string;
  prompt: string;
  first_name: string;
  last_name: string;
}

export const TemplateMarketplaceModal: React.FC<TemplateMarketplaceModalProps> = ({
  open,
  onClose,
  name,
  html,
  prompt,
  first_name,
  last_name,
}) => {
  return (
    <Dialog open={open} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent showCloseButton>
        <DialogTitle>{name}</DialogTitle>
        <div className="text-gray-500 text-sm mb-2">By: {first_name} {last_name}</div>
        <div className="italic text-gray-700 text-sm mb-4">Prompt: {prompt}</div>
        <div className="border rounded bg-gray-50 p-4 overflow-auto" style={{ minHeight: 200, maxHeight: 400 }}>
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
