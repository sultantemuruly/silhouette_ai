import React, { useState } from 'react'
import EmailCapsule from './email-capsule'
import EmailModal from './email-modal'

// Type for scheduled email
interface ScheduledEmail {
  id: string;
  date: string;
  title: string;
  recipient: string;
  content: string;
}

// Mock data for scheduled emails
const scheduledEmails: ScheduledEmail[] = [
  {
    id: '1',
    date: '2024-06-01T10:00:00Z',
    title: 'Project Kickoff',
    recipient: 'alice@example.com',
    content: 'Hi Alice, just a reminder that our project kickoff meeting is scheduled for next week. Please review the attached agenda and let me know if you have any questions. Looking forward to working together!',
  },
  {
    id: '2',
    date: '2024-06-02T14:30:00Z',
    title: 'Invoice Reminder',
    recipient: 'bob@example.com',
    content: 'Dear Bob, this is a gentle reminder regarding your outstanding invoice. Please let us know if you need any assistance with the payment process. Thank you for your business!',
  },
  {
    id: '3',
    date: '2024-06-03T09:15:00Z',
    title: 'Weekly Update',
    recipient: 'carol@example.com',
    content: 'Hello Carol, here is your weekly update. The team has made significant progress on the new features, and we are on track for the upcoming release. Let me know if you have any feedback.',
  },
];

const EmailSchedule = () => {
  const [selectedEmail, setSelectedEmail] = useState<ScheduledEmail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {scheduledEmails.map(email => (
          <div key={email.id} onClick={() => handleCapsuleClick(email)} className="cursor-pointer">
            <EmailCapsule
              date={email.date}
              title={email.title}
              recipient={email.recipient}
              content={email.content}
            />
          </div>
        ))}
      </div>
      {selectedEmail && (
        <EmailModal
          open={modalOpen}
          onClose={handleCloseModal}
          title={selectedEmail.title}
          recipient={selectedEmail.recipient}
          content={selectedEmail.content}
          date={selectedEmail.date}
        />
      )}
    </>
  )
}

export default EmailSchedule;