import React from 'react'
import { useMessageStore } from '@/stores/useMessageStore'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

import { EmailWriteModal } from './email-write-modal'
import MessageDraft from './message-draft';
import { useUser } from '@clerk/nextjs'

const EmailWrite = () => {
    const { isDraft, handleDraft } = useMessageStore() as {isDraft: boolean, handleDraft: () => void};
    const { user, isLoaded } = useUser();

    if (!isLoaded) return <div>Loading user info...</div>;

    return (
      <div>
        {user?.id && user?.emailAddresses?.[0]?.emailAddress && (
          <EmailWriteModal
            user_id={user.id}
            sender={user.emailAddresses[0].emailAddress}
          />
        )}
        <Dialog open={isDraft} onOpenChange={handleDraft}>
          <DialogContent className="w-full max-w-[95vw] sm:max-w-6xl p-0 sm:p-6 px-2 sm:px-6 shadow-none border-none">
            <DialogTitle>Draft</DialogTitle>
            {user?.id && user?.emailAddresses?.[0]?.emailAddress && (
              <MessageDraft user_id={user.id} sender={user.emailAddresses[0].emailAddress} />
            ) }
          </DialogContent>
        </Dialog>
      </div>
    )
}

export default EmailWrite