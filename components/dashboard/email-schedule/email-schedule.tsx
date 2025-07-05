import React, { useState, useEffect, useCallback } from 'react'
import EmailCapsule from './email-capsule'
import EmailModal from './email-modal'
import { useUser } from '@clerk/nextjs'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { Button } from '@/components/ui/button'
// import { EmailWriteModal } from '../email-write/email-write-modal'

// Type for scheduled email
interface ScheduledEmail {
  id: string;
  scheduled_date: string;
  subject: string;
  recipient: string;
  content: string;
  status: 'pending' | 'sent' | 'failed';
}

const EmailSchedule = () => {
  const { user, isLoaded } = useUser();
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<ScheduledEmail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setCategory } = useCategoryStore();
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState({ subject: '', recipient: '', content: '', scheduled_date: '' });
  const [modalError, setModalError] = useState<string | null>(null);
  const [timezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);

  // const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  const refreshScheduledEmails = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/schedule?user_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setScheduledEmails(data);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshScheduledEmails();
    }
  }, [user, refreshScheduledEmails]);

  const handleCapsuleClick = (email: ScheduledEmail) => {
    setSelectedEmail(email);
    setEditFields({
      subject: email.subject,
      recipient: email.recipient,
      content: email.content,
      scheduled_date: email.scheduled_date,
    });
    setEditMode(false);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedEmail(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditFields({ ...editFields, [e.target.name]: e.target.value });
  };

  const handleEditSave = async () => {
    if (!selectedEmail) return;
    // Validation: scheduled_date must be at least 5 minutes in the future and minutes must be a multiple of 5
    const scheduledDate = new Date(editFields.scheduled_date);
    const now = new Date();
    const diffMs = scheduledDate.getTime() - now.getTime();
    const diffMin = diffMs / 60000;
    const minutes = scheduledDate.getMinutes();
    if (diffMin < 5) {
      setModalError('Scheduled time must be at least 5 minutes in the future.');
      return;
    }
    if (minutes % 5 !== 0) {
      setModalError('Minutes must be in 5-minute increments (e.g., 10, 15, 20, etc.).');
      return;
    }
    setModalError(null);
    await fetch('/api/schedule', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedEmail.id,
        user_id: user?.id,
        ...editFields,
        timezone,
      }),
    });
    setModalOpen(false);
    setEditMode(false);
    setSelectedEmail(null);
    refreshScheduledEmails();
  };

  const handleDelete = async () => {
    if (!selectedEmail) return;
    await fetch(`/api/schedule?id=${selectedEmail.id}&user_id=${user?.id}`, {
      method: 'DELETE',
    });
    setModalOpen(false);
    setSelectedEmail(null);
    refreshScheduledEmails();
  };

  // Debug log
  console.log('user.id:', user?.id, 'sender:', user?.emailAddresses?.[0]?.emailAddress, 'isLoaded:', isLoaded);

  if (!isLoaded) {
    return <div>Loading user info...</div>;
  }

  return (
    <>
      {user?.id && user?.emailAddresses?.[0]?.emailAddress && (
        <div className="mb-4 flex justify-end">
          <Button
            variant={'regular'}
            size={'sm'}
            onClick={() => setCategory('wise-write')}
          >
            Schedule New Email
          </Button>
        </div>
      )}
      {/* {isWriteModalOpen && user?.id && user?.emailAddresses?.[0]?.emailAddress && (
        <EmailWriteModal
          refreshScheduledEmails={refreshScheduledEmails}
          user_id={user.id}
          sender={user.emailAddresses[0].emailAddress}
          onClose={() => setIsWriteModalOpen(false)}
        />
      )} */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full mt-6">
        {loading ? (
          <div className="col-span-full text-center text-gray-500">Loading…</div>
        ) : scheduledEmails.length === 0 ? (
          <div className="col-span-full text-center text-gray-500">No scheduled emails.</div>
        ) : (
          scheduledEmails.map(email => (
            <div key={email.id} onClick={() => handleCapsuleClick(email)} className="cursor-pointer">
              <EmailCapsule
                date={email.scheduled_date}
                title={email.subject}
                recipient={email.recipient}
                content={email.content}
                status={email.status}
              />
            </div>
          ))
        )}
      </div>
      {selectedEmail && (
        <EmailModal
          open={modalOpen}
          onClose={handleCloseModal}
          status={selectedEmail.status}
          editMode={editMode}
          editFields={editFields}
          onEditChange={handleEditChange}
          onEdit={handleEditSave}
          onDelete={handleDelete}
          onEditMode={setEditMode}
          onCancelEdit={() => setEditMode(false)}
          error={modalError || undefined}
        />
      )}
    </>
  )
}

export default EmailSchedule;