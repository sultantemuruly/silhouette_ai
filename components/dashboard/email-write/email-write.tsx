import React from 'react'
import { useMessageStore } from '@/stores/useMessageStore'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

import { EmailWriteModal } from './email-write-modal'
import MessageDraft from './message-draft';

const EmailWrite = () => {
    const { isDraft, handleDraft } = useMessageStore() as {isDraft: boolean, handleDraft: () => void};

  return (
    <div>
        <EmailWriteModal />
        <Dialog open={isDraft} onOpenChange={handleDraft}>
          <DialogContent className="w-full max-w-[95vw] sm:max-w-6xl p-0 sm:p-6 px-2 sm:px-6 shadow-none border-none">
            <DialogTitle>Draft</DialogTitle>
            <MessageDraft />
          </DialogContent>
        </Dialog>
    </div>
  )
}

export default EmailWrite