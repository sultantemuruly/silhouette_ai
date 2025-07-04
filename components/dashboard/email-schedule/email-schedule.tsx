import React, { useState, useEffect, useCallback } from 'react'
import EmailCapsule from './email-capsule'
import EmailModal from './email-modal'
import { useUser } from '@clerk/nextjs'
// import { EmailWriteModal } from '../email-write/email-write-modal'

// Type for scheduled email
interface ScheduledEmail {
  id: string;
  scheduled_date: string;
  subject: string;
  recipient: string;
  content: string;
}

const EmailSchedule = () => {
  const { user } = useUser();
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<ScheduledEmail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
//   const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

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
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedEmail(null);
  };

  return (
    <>
      {/* <div className="mb-4 flex justify-end">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          onClick={() => setIsWriteModalOpen(true)}
        >
          Schedule New Email
        </button>
      </div>
      {isWriteModalOpen && (
        <EmailWriteModal
          refreshScheduledEmails={refreshScheduledEmails}
          user_id={user?.id}
          sender={user?.emailAddresses?.[0]?.emailAddress}
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
              />
            </div>
          ))
        )}
      </div>
      {selectedEmail && (
        <EmailModal
          open={modalOpen}
          onClose={handleCloseModal}
          title={selectedEmail.subject}
          recipient={selectedEmail.recipient}
          content={selectedEmail.content}
          date={selectedEmail.scheduled_date}
        />
      )}
    </>
  )
}

export default EmailSchedule;