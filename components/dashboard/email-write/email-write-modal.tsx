"use client"

import React, { useState } from 'react'
import { useRecipient, useSetRecipient, useDate, useSetDate, useMessageStore, useShowSchedule, useSetShowSchedule } from '@/stores/useMessageStore'
import TextareaAutosize from 'react-textarea-autosize';
import dynamic from 'next/dynamic';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { BrainCircuit, Send, CalendarClock } from 'lucide-react'
import { Loader } from '@/components/ui/loader'
import ReactShadow from 'react-shadow';

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
    const selectedTemplate = useMessageStore(state => (state as import('@/types').DraftState).selectedTemplate);
    const setSelectedTemplate = useMessageStore(state => (state as import('@/types').DraftState).setSelectedTemplate);
    const [visualHtml] = useState<string>('');
    const isGraphicMessage = useMessageStore(state => (state as import('@/types').DraftState).isGraphicMessage);
    const setIsGraphicMessage = useMessageStore(state => (state as import('@/types').DraftState).setIsGraphicMessage);

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
    function isToday(selectedDay: string) {
      if (!selectedDay) return false;
      const selected = new Date(selectedDay);
      if (isNaN(selected.getTime())) return false;
      const now = new Date();
      return now.toISOString().slice(0, 10) === selected.toISOString().slice(0, 10);
    }
    function getAvailableHours(selectedDate: string) {
      const { hour } = getNowParts();
      if (isToday(selectedDate)) {
        // For today, only allow current/future hours
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
      const { hour, minute } = getNowParts();
      const mins: string[] = [];
      if (isToday(selectedDate) && parseInt(selectedHour) === hour) {
      for (let m = 0; m < 60; m += 5) {
          if (m > minute + 4) mins.push(m.toString().padStart(2, '0'));
        }
        } else {
        for (let m = 0; m < 60; m += 5) {
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
      // Only sync from store if all picker fields are empty (initial mount or reset)
      if (!date) {
        if (scheduledDay !== "") setScheduledDay("");
        if (scheduledHour !== "") setScheduledHour("");
        if (scheduledMinute !== "00") setScheduledMinute("00");
        return;
      }
      if (!scheduledDay && !scheduledHour && scheduledMinute === "00") {
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        const newDay = d.toISOString().slice(0, 10);
        const newHour = d.getHours().toString().padStart(2, '0');
        const newMinute = d.getMinutes().toString().padStart(2, '0');
          setScheduledDay(newDay);
          setScheduledHour(newHour);
          setScheduledMinute(newMinute);
        }
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
                sender,
                user_id,
                timezone
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
        setIsGraphicMessage(false);
        setDraftMessage(""); // Clear draftMessage when no template
        console.log('[TemplateSelect] Cleared template, draftMessage reset to empty');
        return;
      }
      const t = templates.find(t => t.id === Number(id));
      if (t) {
        setSelectedTemplate(t);
        setIsGraphicMessage(true);
        setDraftMessage(t.html); // Set draftMessage to template HTML
        setShowVisualEditor(true); // Automatically open visual editor
        console.log('[TemplateSelect] Selected template:', t);
        console.log('[TemplateSelect] Setting draftMessage to:', t.html);
      }
    };

    // Handle save from GrapesJS
    const handleVisualSave = (html: string) => {
      setDraftMessage(html);
      setShowVisualEditor(false);
      setIsGraphicMessage(true);
    };

    // When user switches back to plain text
    // const handleSwitchToPlain = () => {
    //   setShowVisualEditor(false);
    //   setIsGraphicMessage(false);
    //   setSelectedTemplate(null);
    //   setVisualHtml('');
    // };

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
                    <Input type="email" required disabled={loading} value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="someone@example.com" className='hover:border-blue-600 active:border-blue-600 focus:ring-blue-600'/>
                </div>
                <div>
                    <div className='text-md font-medium pb-2'>Subject</div>
                    <Input disabled={loading} required value={draftSubject} onChange={(e) => setDraftSubject(e.target.value)} type="text" placeholder="What’s this about?" className='hover:border-blue-600 focus:ring-blue-600'/>
                </div>
                {/* Template selection and visual editor controls */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center">
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
                    <div
                      className="border rounded bg-gray-50 overflow-y-auto min-h-[60px] max-h-[600px] w-full mb-1 mt-2 cursor-pointer hover:shadow-lg transition-shadow"
                      title="Click to edit in Visual Editor"
                      onClick={() => setShowVisualEditor(true)}
                      tabIndex={0}
                      role="button"
                      aria-label="Open Visual Editor"
                      style={{ outline: 'none' }}
                    >
                      <ReactShadow.div>
                        <div className="w-full h-full" style={{ maxHeight: 600, overflowY: 'auto' }} dangerouslySetInnerHTML={{ __html: draftMessage }} />
                      </ReactShadow.div>
                    </div>
                  )}
                </div>
                {/* Visual Editor Modal */}
                <Dialog open={showVisualEditor} onOpenChange={setShowVisualEditor}>
                  <DialogContent className="max-w-3xl w-full">
                      <div className="flex justify-between items-center mb-2">
                      <DialogTitle>Visual Email Editor</DialogTitle>
                      {/* <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={handleSwitchToPlain}>Switch to Plain Text</Button>
                          <Button size="sm" variant="outline" onClick={() => setShowVisualEditor(false)}>Close</Button>
                      </div> */}
                      </div>
                      <GrapesJSEditor
                        initialHtml={visualHtml || draftMessage}
                        onSave={handleVisualSave}
                        disabled={loading}
                      />
                  </DialogContent>
                </Dialog>
                {/* Message textarea (hide if visual editor or graphic message is active) */}
                {!isGraphicMessage && !showVisualEditor && (
                  <div>
                    <div className='text-md font-medium pb-2'>Message</div>
                    <TextareaAutosize 
                      disabled={loading} 
                      required 
                      value={draftMessage} 
                      onChange={(e) => setDraftMessage(e.target.value)}
                      placeholder="What's on your mind?" 
                      minRows={8}
                      className='w-full min-h-[200px] border border-input border-rounded-lg hover:border-blue-600 focus:ring-blue-600 p-2 resize-y'/>
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
                          const hours = getAvailableHours(newDay);
                          let newHour = scheduledHour;
                          // Only auto-correct hour if today and not available
                          if (isToday(newDay) && !hours.includes(Number(scheduledHour))) {
                            newHour = hours[0]?.toString().padStart(2, '0') ?? '';
                            setScheduledHour(newHour);
                          }
                          const mins = getAvailableMinutes(newDay, newHour);
                          let newMinute = scheduledMinute;
                          // Only auto-correct minute if today and not available
                          if (isToday(newDay) && !mins.includes(scheduledMinute)) {
                            newMinute = mins[0] ?? '';
                            setScheduledMinute(newMinute);
                          }
                          // For future dates, do not auto-correct hour/minute
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
                          const mins = getAvailableMinutes(scheduledDay, newHour);
                          let newMinute = scheduledMinute;
                          // Only auto-correct minute if today and not available
                          if (isToday(scheduledDay) && !mins.includes(scheduledMinute)) {
                            newMinute = mins[0] ?? '';
                            setScheduledMinute(newMinute);
                          }
                          // For future dates, do not auto-correct minute
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
        {/* Sticky Action Bar */}
        <div className="sticky bottom-0 left-0 w-full bg-white border-t z-10 px-6 py-3 flex justify-end gap-2 shadow-sm">
          <Button type="button" variant="regular" onClick={handleDraft} disabled={loading} aria-label="AI Assist"><BrainCircuit className='w-4 h-4' /> AI</Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowSchedule(!showSchedule);
                  if (showSchedule && onClose) onClose();
          }} disabled={loading} aria-label={showSchedule ? 'Undo Schedule' : 'Schedule'}>
                  <CalendarClock className='w-4 h-4 mr-1' /> {showSchedule ? 'Undo Schedule' : 'Schedule'}
                </Button>
                {showSchedule ? (
            <Button type="button" variant="regular" onClick={handleSchedule} disabled={loading || !scheduledDay || scheduledHour === ""} aria-label="Confirm Schedule">
                    Confirm Schedule
                  </Button>
                ) : (
            <Button type="submit" variant="regular" disabled={loading} aria-label="Send Email"><Send /> {loading ? <Loader loadingText="" additionalStyles="w-4 h-4" /> : 'Send'}</Button>
                )}
            </div>
        <div className="w-full text-right pr-6 pb-2">
          <span className="text-xs text-gray-400">Powered by <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-500">Resend</a></span>
        </div>
        </form>
    </Card>
  )
}
