"use client"

import React, { useState } from 'react'
import { useMessageStore } from '@/stores/useMessageStore'
import TextareaAutosize from 'react-textarea-autosize';

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { BrainCircuit, Send, CalendarClock } from 'lucide-react'
import { Loader } from '@/components/ui/loader'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

interface EmailWriteModalProps {
  refreshScheduledEmails?: () => Promise<void>;
  user_id?: string;
  sender?: string;
  onClose?: () => void;
}

export const EmailWriteModal: React.FC<EmailWriteModalProps> = ({ refreshScheduledEmails, user_id, sender, onClose }) => {
    const { handleDraft } = useMessageStore() as {handleDraft: () => void};
    const { draftMessage, setDraftMessage } = useMessageStore() as {draftMessage: string, setDraftMessage: (draftMessage: string) => void};
    const { draftSubject, setDraftSubject } = useMessageStore() as {draftSubject: string, setDraftSubject: (draftSubject: string) => void};
    const { recipient, setRecipient } = useMessageStore() as {recipient: string, setRecipient: (recipient: string) => void};

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showSchedule, setShowSchedule] = useState(false);
    const [scheduledDay, setScheduledDay] = useState<string>(""); // YYYY-MM-DD
    const [scheduledHour, setScheduledHour] = useState<string>(""); // "0" to "23"

    // Helper to get the current date/time in YYYY-MM-DD and hour
    function getMinDate() {
      const now = new Date();
      return now.toISOString().slice(0, 10);
    }
    function getMinHour(selectedDate: string) {
      const now = new Date();
      if (selectedDate === getMinDate()) {
        const nextHour = now.getHours() + 1;
        if (nextHour > 23) {
          // If it's past 23, user must pick tomorrow
          return 24; // special value, will be handled in rendering
        }
        return nextHour;
      }
      return 0;
    }
    function isFutureDateTime(date: string, hour: string) {
      if (!date || hour === "") return false;
      const now = new Date();
      const selected = new Date(date + 'T' + hour.padStart(2, '0') + ':00:00');
      return selected > now;
    }
    function getScheduledDateTime() {
      if (!scheduledDay || scheduledHour === "") return "";
      return scheduledDay + 'T' + scheduledHour.padStart(2, '0') + ':00:00';
    }

    const handleSend = async () => {
        if (!recipient || !draftSubject || !draftMessage) {
            setError('All fields are required.');
            setSuccess(null);
            return;
        }
        if (!isValidEmail(recipient)) {
            setError('Please enter a valid email address.');
            setSuccess(null);
            return;
        }
        setError(null);
        setLoading(true);
        const response = await fetch('/api/send', {
            method: 'POST',
            body: JSON.stringify({
                recipient,
                subject: draftSubject,
                content: draftMessage,
                sender
            })
        })
        if (response.ok) {
            setLoading(false);
            setDraftMessage('');
            setDraftSubject('');
            setRecipient(''); 
            setError(null);
            setSuccess('Sent successfully!');
            setTimeout(() => setSuccess(null), 3000);
            console.log('Email sent successfully');
        } else {
            setLoading(false);
            setError('Failed to send email');
            setSuccess(null);
            console.error('Failed to send email');
        }
    }

    const handleSchedule = async () => {
        if (!recipient || !draftSubject || !draftMessage || !scheduledDay || scheduledHour === "") {
            setError('All fields and schedule date/hour are required.');
            setSuccess(null);
            return;
        }
        if (!isValidEmail(recipient)) {
            setError('Please enter a valid email address.');
            setSuccess(null);
            return;
        }
        if (!isFutureDateTime(scheduledDay, scheduledHour)) {
            setError('Please select a future date and hour.');
            setSuccess(null);
            return;
        }
        if (!user_id || !sender) {
            setError('User not found. Please log in.');
            setSuccess(null);
            return;
        }
        setError(null);
        setLoading(true);
        const response = await fetch('/api/schedule', {
            method: 'POST',
            body: JSON.stringify({
                user_id,
                sender,
                recipient,
                subject: draftSubject,
                content: draftMessage,
                scheduled_date: getScheduledDateTime(),
            })
        })
        if (response.ok) {
            setLoading(false);
            setDraftMessage('');
            setDraftSubject('');
            setRecipient(''); 
            setScheduledDay("");
            setScheduledHour("");
            setShowSchedule(false);
            setError(null);
            setSuccess('Scheduled successfully!');
            setTimeout(() => setSuccess(null), 3000);
            if (refreshScheduledEmails) {
              refreshScheduledEmails();
            }
            if (onClose) onClose();
            console.log('Email scheduled successfully');
        } else {
            setLoading(false);
            setError('Failed to schedule email');
            setSuccess(null);
            console.error('Failed to schedule email');
        }
    }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Write Email with AI</CardTitle>
            <CardDescription>
              Compose your email and use AI assistance to generate or improve your message.
            </CardDescription>
        </CardHeader>
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
        >
        <CardContent>
            <div className='flex flex-col gap-4'>
                <div>
                    <div className='text-md font-medium pb-2'>Recipient</div>
                    <Input type="email" required disabled={loading} value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Enter recipient email" className='hover:border-blue-600 active:border-blue-600 focus:ring-blue-600'/>
                </div>
                <div>
                    <div className='text-md font-medium pb-2'>Subject</div>
                    <Input disabled={loading} required value={draftSubject} onChange={(e) => setDraftSubject(e.target.value)} type="text" placeholder="Enter subject" className='hover:border-blue-600 focus:ring-blue-600'/>
                </div>
                <div>
                    <div className='text-md font-medium pb-2'>Message</div>
                    <TextareaAutosize disabled={loading} required value={draftMessage} onChange={(e) => setDraftMessage(e.target.value)} placeholder="Enter message" className='w-full h-40 border border-input border-rounded-lg hover:border-blue-600 focus:ring-blue-600 p-2'/>
                </div>
                {showSchedule && (
                  <div>
                    <div className='text-md font-medium pb-2'>Schedule Date & Hour</div>
                    <div className="flex items-center gap-1">
                      <Input
                        type="date"
                        min={getMinDate()}
                        value={scheduledDay}
                        onChange={e => {
                          setScheduledDay(e.target.value);
                          // If the selected date is today and the hour is less than min hour, reset hour
                          if (e.target.value === getMinDate() && scheduledHour !== "" && parseInt(scheduledHour) < getMinHour(e.target.value)) {
                            setScheduledHour("");
                          }
                        }}
                        disabled={loading}
                        className='hover:border-blue-600 focus:ring-blue-600 w-[140px]'
                      />
                      <Input
                        type="number"
                        min={scheduledDay === getMinDate() ? getMinHour(scheduledDay) : 0}
                        max={23}
                        value={scheduledHour}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === "") setScheduledHour("");
                          else {
                            const minHour = scheduledDay === getMinDate() ? getMinHour(scheduledDay) : 0;
                            const num = Math.max(minHour, Math.min(23, parseInt(val)));
                            setScheduledHour(num.toString());
                          }
                        }}
                        placeholder="Hour"
                        disabled={loading || !scheduledDay || (scheduledDay === getMinDate() && getMinHour(scheduledDay) === 24)}
                        className='w-14 ml-2 hover:border-blue-600 focus:ring-blue-600 text-center'
                      />
                      <span className="ml-1 text-base text-gray-700">hour</span>
                    </div>
                    {scheduledDay === getMinDate() && getMinHour(scheduledDay) === 24 && (
                      <div className="text-xs text-red-500 mt-1">No more hours available today. Please select a future date.</div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">Minutes will always be 00. Only future hours are allowed.</div>
                  </div>
                )}
                {error && <div className="text-red-500 text-sm pt-1">{error}</div>}
                {success && <div className="text-green-600 text-sm pt-1">{success}</div>}
            </div>
        </CardContent>
        <CardFooter>
            <div className='flex justify-end gap-2 w-full'>
                <Button type="button" variant="regular" onClick={handleDraft} disabled={loading}><BrainCircuit className='w-4 h-4' /> AI</Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowSchedule(v => !v);
                  if (showSchedule && onClose) onClose();
                }} disabled={loading}>
                  <CalendarClock className='w-4 h-4 mr-1' /> {showSchedule ? 'Undo Schedule' : 'Schedule'}
                </Button>
                {showSchedule ? (
                  <Button type="button" variant="outline" onClick={handleSchedule} disabled={loading || !scheduledDay || scheduledHour === ""}>
                    Confirm Schedule
                  </Button>
                ) : (
                  <Button type="submit" variant="outline" disabled={loading}><Send /> {loading ? <Loader loadingText="" additionalStyles="w-4 h-4" /> : 'Send'}</Button>
                )}
            </div>
        </CardFooter>
        <div className="w-full text-right pr-6 pb-2">
          <span className="text-xs text-gray-400">Powered by <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-500">Resend</a></span>
        </div>
        </form>
    </Card>
  )
}
