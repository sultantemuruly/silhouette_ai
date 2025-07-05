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
    const [scheduledMinute, setScheduledMinute] = useState<string>("00"); // "00", "05", ... "55"
    const [timezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);

    // Helper to get the current date/time in YYYY-MM-DD and hour
    function getMinDate() {
      const now = new Date();
      return now.toISOString().slice(0, 10);
    }
    function getNowParts() {
      const now = new Date();
      return {
        hour: now.getHours(),
        minute: now.getMinutes(),
        date: now.toISOString().slice(0, 10),
      };
    }
    function getAvailableHours(selectedDate: string) {
      const { hour, date } = getNowParts();
      if (selectedDate === date) {
        // For today, include current hour if there is a valid minute
        const validMinutes = getAvailableMinutes(selectedDate, hour.toString());
        const hours = [];
        if (validMinutes.length > 0) hours.push(hour);
        for (let h = hour + 1; h <= 23; h++) hours.push(h);
        return hours;
      }
      // For future dates, all hours
      return Array.from({ length: 24 }, (_, i) => i);
    }
    function getAvailableMinutes(selectedDate: string, selectedHour: string) {
      const { hour, minute, date } = getNowParts();
      const mins: string[] = [];
      for (let m = 0; m < 60; m += 5) {
        if (selectedDate === date && parseInt(selectedHour) === hour) {
          // Only allow minutes at least 5 min in the future
          if (m > minute + 4) mins.push(m.toString().padStart(2, '0'));
        } else {
          mins.push(m.toString().padStart(2, '0'));
        }
      }
      return mins;
    }
    function getScheduledDateTime() {
      if (!scheduledDay || scheduledHour === "" || scheduledMinute === "") return "";
      return scheduledDay + 'T' + scheduledHour.padStart(2, '0') + ':' + scheduledMinute.padStart(2, '0') + ':00';
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
        if (!recipient || !draftSubject || !draftMessage || !scheduledDay || scheduledHour === "" || scheduledMinute === "") {
            setError('All fields and schedule date/hour/minute are required.');
            setSuccess(null);
            return;
        }
        if (!isValidEmail(recipient)) {
            setError('Please enter a valid email address.');
            setSuccess(null);
            return;
        }
        // Validate scheduled time is at least 5 minutes in the future
        const scheduledDate = new Date(getScheduledDateTime());
        const now = new Date();
        const diffMs = scheduledDate.getTime() - now.getTime();
        const diffMin = diffMs / 60000;
        const minutes = scheduledDate.getMinutes();
        if (diffMin < 5) {
            setError('Scheduled time must be at least 5 minutes in the future.');
            setSuccess(null);
            return;
        }
        if (minutes % 5 !== 0) {
            setError('Minutes must be in 5-minute increments (e.g., 00, 05, 10, etc.).');
            setSuccess(null);
            return;
        }
        if (!user_id || !sender) {
            console.log(user_id);
            console.log(sender);
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
                timezone,
            })
        })
        if (response.ok) {
            setLoading(false);
            setDraftMessage('');
            setDraftSubject('');
            setRecipient(''); 
            setScheduledDay("");
            setScheduledHour("");
            setScheduledMinute("00");
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
                    <div className='text-md font-medium pb-2'>Schedule Date & Time</div>
                    <div className="flex items-center gap-1">
                      <Input
                        type="date"
                        min={getMinDate()}
                        value={scheduledDay}
                        onChange={e => {
                          setScheduledDay(e.target.value);
                          // Reset hour/minute if not valid for new date
                          const hours = getAvailableHours(e.target.value);
                          if (!hours.includes(Number(scheduledHour))) {
                            setScheduledHour(hours[0]?.toString() ?? '');
                          }
                          const mins = getAvailableMinutes(e.target.value, scheduledHour);
                          if (!mins.includes(scheduledMinute)) {
                            setScheduledMinute(mins[0] ?? '');
                          }
                        }}
                        disabled={loading}
                        className='hover:border-blue-600 focus:ring-blue-600 w-[140px]'
                      />
                      <select
                        value={scheduledHour}
                        onChange={e => {
                          setScheduledHour(e.target.value);
                          // Reset minute if not valid for new hour
                          const mins = getAvailableMinutes(scheduledDay, e.target.value);
                          if (!mins.includes(scheduledMinute)) {
                            setScheduledMinute(mins[0] ?? '');
                          }
                        }}
                        disabled={loading || !scheduledDay}
                        className='w-16 ml-2 border rounded px-2 py-1 text-center hover:border-blue-600 focus:ring-blue-600'
                      >
                        <option value="" disabled>Select hour</option>
                        {getAvailableHours(scheduledDay).map(h => (
                          <option key={h} value={h.toString().padStart(2, '0')}>{h.toString().padStart(2, '0')}</option>
                        ))}
                      </select>
                      <select
                        value={scheduledMinute}
                        onChange={e => setScheduledMinute(e.target.value)}
                        disabled={loading || !scheduledDay || !scheduledHour}
                        className='w-16 ml-2 border rounded px-2 py-1 text-center hover:border-blue-600 focus:ring-blue-600'
                      >
                        <option value="" disabled>Select min</option>
                        {getAvailableMinutes(scheduledDay, scheduledHour).map(val => (
                          <option key={val} value={val}>{val}</option>
                        ))}
                      </select>
                      <span className="ml-1 text-base text-gray-700">hour:min</span>
                    </div>
                    {scheduledDay === getMinDate() && getAvailableHours(scheduledDay).length === 0 && (
                      <div className="text-xs text-red-500 mt-1">No more times available today. Please select a future date.</div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">Minutes must be in 5-minute increments. Only future times are allowed.</div>
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
