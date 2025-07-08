"use client"

import React, { useState } from 'react'
import { useRecipient, useSetRecipient, useDate, useSetDate, useMessageStore, useShowSchedule, useSetShowSchedule } from '@/stores/useMessageStore'
import TextareaAutosize from 'react-textarea-autosize';
import dynamic from 'next/dynamic';

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

const GrapesJSEditor = dynamic(() => import('../email-template/grapesjs-editor'), { ssr: false });

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

interface EmailTemplateType {
  id: number;
  name: string;
  html: string;
  prompt: string;
  created_at: string;
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
    const recipient = useRecipient();
    const setRecipient = useSetRecipient();
    const date = useDate();
    const setDate = useSetDate();
    const showSchedule = useShowSchedule();
    const setShowSchedule = useSetShowSchedule();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [scheduledDay, setScheduledDay] = useState<string>("");
    const [scheduledHour, setScheduledHour] = useState<string>("");
    const [scheduledMinute, setScheduledMinute] = useState<string>("00");
    const [timezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
    const [showVisualEditor, setShowVisualEditor] = useState(false);
    const [templates, setTemplates] = useState<EmailTemplateType[]>([]);
    const [templatesLoading, setTemplatesLoading] = useState(false);
    const [templatesError, setTemplatesError] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplateType | null>(null);
    const [visualHtml, setVisualHtml] = useState<string>('');
    const [isGraphicMessage, setIsGraphicMessage] = useState(false);

    // Fetch templates on mount
    React.useEffect(() => {
      setTemplatesLoading(true);
      setTemplatesError('');
      fetch('/api/email-templates')
        .then(res => res.json())
        .then(data => {
          if (data.templates) setTemplates(data.templates);
          else setTemplatesError(data.error || 'Failed to fetch templates.');
        })
        .catch(() => setTemplatesError('Network error.'))
        .finally(() => setTemplatesLoading(false));
    }, []);

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

    // Sync local picker state with store date
    React.useEffect(() => {
      if (!date) {
        if (scheduledDay !== "") setScheduledDay("");
        if (scheduledHour !== "") setScheduledHour("");
        if (scheduledMinute !== "00") setScheduledMinute("00");
        return;
      }
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        const newDay = d.toISOString().slice(0, 10);
        const newHour = d.getHours().toString().padStart(2, '0');
        const newMinute = d.getMinutes().toString().padStart(2, '0');
        if (scheduledDay !== newDay) setScheduledDay(newDay);
        if (scheduledHour !== newHour) setScheduledHour(newHour);
        if (scheduledMinute !== newMinute) setScheduledMinute(newMinute);
      }
    }, [date]);

    // Validate and update store date (only if all fields are set and valid)
    React.useEffect(() => {
      if (!showSchedule) return;
      const iso = getScheduledDateTime();
      if (!scheduledDay || !scheduledHour || !scheduledMinute) {
        return;
      }
      const scheduledDate = new Date(iso);
      const now = new Date();
      const diffMs = scheduledDate.getTime() - now.getTime();
      const diffMin = diffMs / 60000;
      const minutes = scheduledDate.getMinutes();
      if (diffMin < 5) {
        return;
      } else if (minutes % 5 !== 0) {
        return;
      } else {
        if (iso !== date) setDate(iso);
      }
    }, [scheduledDay, scheduledHour, scheduledMinute, showSchedule]);

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

    // Handle template selection
    const handleTemplateSelect = (id: string) => {
      if (!id) {
        setSelectedTemplate(null);
        setVisualHtml('');
        setIsGraphicMessage(false);
        return;
      }
      const t = templates.find(t => t.id === Number(id));
      if (t) {
        setSelectedTemplate(t);
        setVisualHtml(t.html);
        setIsGraphicMessage(true);
      }
    };

    // Handle save from GrapesJS
    const handleVisualSave = (html: string) => {
      setDraftMessage(html);
      setShowVisualEditor(false);
      setIsGraphicMessage(true);
    };

    // When user clicks Compose with Visual Editor
    const handleOpenVisualEditor = () => {
      setShowVisualEditor(true);
      setIsGraphicMessage(true);
    };

    // When user switches back to plain text
    const handleSwitchToPlain = () => {
      setShowVisualEditor(false);
      setIsGraphicMessage(false);
      setSelectedTemplate(null);
      setVisualHtml('');
    };

    // Helper to check if draftMessage is HTML
    const isHtml = (str: string) => /<([A-Za-z][A-Za-z0-9]*)\b[^>]*>(.*?)<\/\1>/.test(str);

  return (
    <Card>
        <CardHeader>
            <CardTitle>Write Email with AI</CardTitle>
            <CardDescription>
              Compose your email and use AI assistance to generate or improve your message. You can also use a saved template and edit visually.
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
                <div>{date}</div>
                <div>
                    <div className='text-md font-medium pb-2'>Subject</div>
                    <Input disabled={loading} required value={draftSubject} onChange={(e) => setDraftSubject(e.target.value)} type="text" placeholder="Enter subject" className='hover:border-blue-600 focus:ring-blue-600'/>
                </div>
                {/* Template selection and visual editor controls */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleOpenVisualEditor}
                      disabled={!selectedTemplate || !selectedTemplate.id || templatesLoading || loading}
                    >
                      Compose with Visual Editor
                    </Button>
                    <select
                      className="border rounded p-2 text-sm"
                      value={selectedTemplate?.id || ''}
                      onChange={e => handleTemplateSelect(e.target.value)}
                      disabled={templatesLoading || loading}
                    >
                      <option value="">Template: None</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    {templatesLoading && <span className="text-xs text-gray-400 ml-2">Loading templates...</span>}
                    {templatesError && <span className="text-xs text-red-500 ml-2">{templatesError}</span>}
                  </div>
                  {/* Show preview if draftMessage is HTML and not editing visually */}
                  {!showVisualEditor && isHtml(draftMessage) && isGraphicMessage && (
                    <div className="border rounded bg-gray-50 overflow-hidden min-h-[60px] max-h-[200px] w-full mb-1 mt-2">
                      <div className="w-full h-full" style={{ pointerEvents: 'none' }} dangerouslySetInnerHTML={{ __html: draftMessage }} />
                    </div>
                  )}
                </div>
                {/* Visual Editor Modal */}
                {showVisualEditor && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg p-4 max-w-3xl w-full relative">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-semibold text-lg">Visual Email Editor</div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={handleSwitchToPlain}>Switch to Plain Text</Button>
                          <Button size="sm" variant="outline" onClick={() => setShowVisualEditor(false)}>Close</Button>
                        </div>
                      </div>
                      <GrapesJSEditor
                        initialHtml={visualHtml || draftMessage}
                        onSave={handleVisualSave}
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}
                {/* Message textarea (hide if visual editor or graphic message is active) */}
                {!isGraphicMessage && !showVisualEditor && (
                  <div>
                    <div className='text-md font-medium pb-2'>Message</div>
                    <TextareaAutosize disabled={loading} required value={draftMessage} onChange={(e) => setDraftMessage(e.target.value)} placeholder="Enter message" className='w-full h-40 border border-input border-rounded-lg hover:border-blue-600 focus:ring-blue-600 p-2'/>
                  </div>
                )}
                {showSchedule && (
                  <div>
                    <div className='text-md font-medium pb-2'>Schedule Date & Time</div>
                    <div className="flex items-center gap-1">
                      <Input
                        type="date"
                        min={getMinDate()}
                        value={scheduledDay}
                        onChange={e => {
                          const newDay = e.target.value;
                          setScheduledDay(newDay);
                          // Reset hour/minute if not valid for new date
                          const hours = getAvailableHours(newDay);
                          let newHour = scheduledHour;
                          if (!hours.includes(Number(scheduledHour))) {
                            newHour = hours[0]?.toString().padStart(2, '0') ?? '';
                            setScheduledHour(newHour);
                          }
                          const mins = getAvailableMinutes(newDay, newHour);
                          let newMinute = scheduledMinute;
                          if (!mins.includes(scheduledMinute)) {
                            newMinute = mins[0] ?? '';
                            setScheduledMinute(newMinute);
                          }
                          // Update store
                          if (newDay && newHour && newMinute) {
                            const iso = newDay + 'T' + newHour.padStart(2, '0') + ':' + newMinute.padStart(2, '0') + ':00';
                            if (iso !== date) setDate(iso);
                          }
                        }}
                        disabled={loading}
                        className='hover:border-blue-600 focus:ring-blue-600 w-[140px]'
                      />
                      <select
                        value={scheduledHour}
                        onChange={e => {
                          const newHour = e.target.value;
                          setScheduledHour(newHour);
                          // Reset minute if not valid for new hour
                          const mins = getAvailableMinutes(scheduledDay, newHour);
                          let newMinute = scheduledMinute;
                          if (!mins.includes(scheduledMinute)) {
                            newMinute = mins[0] ?? '';
                            setScheduledMinute(newMinute);
                          }
                          // Update store
                          if (scheduledDay && newHour && newMinute) {
                            const iso = scheduledDay + 'T' + newHour.padStart(2, '0') + ':' + newMinute.padStart(2, '0') + ':00';
                            if (iso !== date) setDate(iso);
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
                        onChange={e => {
                          const newMinute = e.target.value;
                          setScheduledMinute(newMinute);
                          // Update store
                          if (scheduledDay && scheduledHour && newMinute) {
                            const iso = scheduledDay + 'T' + scheduledHour.padStart(2, '0') + ':' + newMinute.padStart(2, '0') + ':00';
                            if (iso !== date) setDate(iso);
                          }
                        }}
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
                  setShowSchedule(!showSchedule);
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
