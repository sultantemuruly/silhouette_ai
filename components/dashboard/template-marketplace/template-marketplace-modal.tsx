import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import ReactShadow from 'react-shadow';

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
          <ReactShadow.div>
            <div style={{ width: '100%', minHeight: 200 }} dangerouslySetInnerHTML={{ __html: html }} />
          </ReactShadow.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
