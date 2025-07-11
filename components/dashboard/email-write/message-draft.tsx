import React, { useState } from 'react'
import { useRecipient, useSetRecipient, useSetDate, useDate, useMessageStore, useShowSchedule, useSetShowSchedule } from '@/stores/useMessageStore'
import ReactMarkdown from 'react-markdown';
import TextareaAutosize from 'react-textarea-autosize';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import dynamic from 'next/dynamic';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import ReactShadow from 'react-shadow';

const GrapesJSEditor = dynamic(() => import('../email-template/grapesjs-editor'), { ssr: false });

// Add prop types
interface MessageDraftProps {
  user_id?: string;
  sender?: string;
}

const MessageDraft: React.FC<MessageDraftProps> = ({ user_id, sender }) => {
    const { draftMessage, setDraftMessage } = useMessageStore() as {draftMessage: string, setDraftMessage: (draftMessage: string) => void};
    const { draftSubject, setDraftSubject } = useMessageStore() as {draftSubject: string, setDraftSubject: (draftSubject: string) => void};
    const recipient = useRecipient();
    const setRecipient = useSetRecipient();
    const setDate = useSetDate();
    const date = useDate();
    const { handleDraft } = useMessageStore() as { handleDraft: () => void };
    const showSchedule = useShowSchedule();
    const setShowSchedule = useSetShowSchedule();

    // AI chat state
    const [chat, setChat] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    // Date/time picker state
    const [scheduledDay, setScheduledDay] = useState<string>("");
    const [scheduledHour, setScheduledHour] = useState<string>("");
    const [scheduledMinute, setScheduledMinute] = useState<string>("00");
    const [dateError, setDateError] = useState<string | null>(null);

    // Email validation helper (copied from modal)
    function isValidEmail(email: string) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
      const { hour, minute, date } = getNowParts();
      const mins: string[] = [];
      if (selectedDate === date && parseInt(selectedHour) === hour) {
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
    // Validate and update store date (only if all fields are set and valid)
    React.useEffect(() => {
      const iso = getScheduledDateTime();
      if (!scheduledDay || !scheduledHour || !scheduledMinute) {
        setDateError(null);
        return;
      }
      const scheduledDate = new Date(iso);
      const now = new Date();
      const diffMs = scheduledDate.getTime() - now.getTime();
      const diffMin = diffMs / 60000;
      const minutes = scheduledDate.getMinutes();
      if (diffMin < 5) {
        setDateError('Scheduled time must be at least 5 minutes in the future.');
        return;
      } else if (minutes % 5 !== 0) {
        setDateError('Minutes must be in 5-minute increments (e.g., 00, 05, 10, etc.).');
        return;
      } else {
        setDateError(null);
        if (iso !== date) setDate(iso);
      }
    }, [scheduledDay, scheduledHour, scheduledMinute]);

    // Reset date/time picker state when toggling off schedule
    React.useEffect(() => {
      if (!showSchedule) {
        setScheduledDay("");
        setScheduledHour("");
        setScheduledMinute("00");
        setDateError(null);
      }
    }, [showSchedule]);

    const [scheduleError, setScheduleError] = useState<string | null>(null);
    const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);
    const [sendError, setSendError] = useState<string | null>(null);
    const [sendSuccess, setSendSuccess] = useState<string | null>(null);

    const isGraphicMessage = useMessageStore(state => (state as import('@/types').DraftState).isGraphicMessage);
    const setIsGraphicMessage = useMessageStore(state => (state as import('@/types').DraftState).setIsGraphicMessage);
    const [showVisualEditor, setShowVisualEditor] = useState(false);
    const [aiHtml, setAiHtml] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);

    // Add template state and fetching logic
    const [templates, setTemplates] = useState<{ id: number; name: string; html: string; prompt: string; created_at: string; }[]>([]);
    const [templatesLoading, setTemplatesLoading] = useState(false);
    const [templatesError, setTemplatesError] = useState('');
    const selectedTemplate = useMessageStore(state => (state as import('@/types').DraftState).selectedTemplate);
    const setSelectedTemplate = useMessageStore(state => (state as import('@/types').DraftState).setSelectedTemplate);

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
        console.log('[TemplateSelect] Selected template:', t);
        console.log('[TemplateSelect] Setting draftMessage to:', t.html);
      }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSendError(null);
      setSendSuccess(null);
      setScheduleError(null);
      setScheduleSuccess(null);
      // Determine message content: use template HTML if selected, else draftMessage
      const messageContent = isGraphicMessage ? (draftMessage || selectedTemplate?.html || "") : draftMessage;
      console.log('[FormSubmit] recipient:', recipient);
      console.log('[FormSubmit] draftSubject:', draftSubject);
      console.log('[FormSubmit] draftMessage:', draftMessage);
      console.log('[FormSubmit] selectedTemplate:', selectedTemplate);
      console.log('[FormSubmit] isGraphicMessage:', isGraphicMessage);
      console.log('[FormSubmit] messageContent:', messageContent);
      if (showSchedule) {
        // Schedule validation (updated)
        if (!recipient || !draftSubject || !messageContent || !scheduledDay || scheduledHour === "" || scheduledMinute === "") {
          setScheduleError('All fields and schedule date/hour/minute are required.');
          setScheduleSuccess(null);
          return;
        }
        if (!isValidEmail(recipient)) {
          setScheduleError('Please enter a valid email address.');
          setScheduleSuccess(null);
          return;
        }
        if (!user_id || !sender) {
          setScheduleError('User not found. Please log in.');
          setScheduleSuccess(null);
          return;
        }
        // Validate scheduled time is at least 5 minutes in the future
        const scheduledDate = new Date(getScheduledDateTime());
        const now = new Date();
        const diffMs = scheduledDate.getTime() - now.getTime();
        const diffMin = diffMs / 60000;
        const minutes = scheduledDate.getMinutes();
        if (diffMin < 5) {
          setScheduleError('Scheduled time must be at least 5 minutes in the future.');
          setScheduleSuccess(null);
          return;
        }
        if (minutes % 5 !== 0) {
          setScheduleError('Minutes must be in 5-minute increments (e.g., 00, 05, 10, etc.).');
          setScheduleSuccess(null);
          return;
        }
        setLoading(true);
        try {
          const res = await fetch('/api/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id,
              sender,
              recipient,
              subject: draftSubject,
              content: messageContent,
              scheduled_date: getScheduledDateTime(),
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            })
          });
          if (res.ok) {
            setScheduleSuccess('Scheduled successfully!');
            setTimeout(() => setScheduleSuccess(null), 3000);
            setShowSchedule(false);
            setScheduledDay("");
            setScheduledHour("");
            setScheduledMinute("00");
            setDateError(null);
            setDate("");
            setDraftMessage("");
            setDraftSubject("");
            setRecipient("");
            toast.success('Email scheduled successfully!');
            handleDraft();
          } else {
            setScheduleError('Failed to schedule email');
          }
        } catch {
          setScheduleError('Failed to schedule email');
        }
        setLoading(false);
        return;
      } else {
        // Send validation (updated)
        if (!recipient || !draftSubject || !messageContent) {
          setSendError('All fields are required.');
          setSendSuccess(null);
          return;
        }
        if (!isValidEmail(recipient)) {
          setSendError('Please enter a valid email address.');
          setSendSuccess(null);
          return;
        }
        setLoading(true);
        try {
          const res = await fetch('/api/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipient,
              subject: draftSubject,
              content: messageContent,
              user_id,
              sender,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            })
          });
          if (res.ok) {
            setSendSuccess('Sent successfully!');
            setTimeout(() => setSendSuccess(null), 3000);
            setDraftMessage("");
            setDraftSubject("");
            setRecipient("");
            toast.success('Email sent successfully!');
            handleDraft();
          } else {
            setSendError('Failed to send email');
          }
        } catch {
          setSendError('Failed to send email');
        }
        setLoading(false);
        return;
      }
    };

    const handleSend = async () => {
      if (!input.trim()) return;
      setLoading(true);
      setAiLoading(false);
      setChat(prev => [...prev, { role: 'user', content: input }]);
      try {
        // If in visual mode, send current HTML to AI
        if (isGraphicMessage && showVisualEditor) {
          setAiLoading(true);
          const currentHtml = selectedTemplate?.html || draftMessage;
          const res = await fetch('/api/ai-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: input, currentHtml }),
          });
          const data = await res.json();
          // Expect AI to return { html: ... }
          if (data.html) {
            setAiHtml(data.html);
            setDraftMessage(data.html);
            setChat(prev => [...prev, { role: 'ai', content: 'Template updated!' }]);
          } else {
            setChat(prev => [...prev, { role: 'ai', content: data.message || 'AI did not return HTML.' }]);
          }
          setAiLoading(false);
        } else {
          // Plain text mode: existing logic
          const res = await fetch('/api/ai-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: input, subject: draftSubject, body: draftMessage }),
          });
          const data = await res.json();
          // Use structured fields from backend
          const { recipient: aiRecipient, subject: aiSubject, body: aiBody, date: aiDate, message: aiMessage } = data;
          if (aiRecipient) setRecipient(aiRecipient);
          if (aiSubject) setDraftSubject(aiSubject);
          if (aiBody) setDraftMessage(aiBody);
          if (aiDate) {
            setDate(aiDate);
            // Also update date picker state
            const d = new Date(aiDate);
            if (!isNaN(d.getTime())) {
              setScheduledDay(d.toISOString().slice(0, 10));
              setScheduledHour(d.getHours().toString().padStart(2, '0'));
              setScheduledMinute(d.getMinutes().toString().padStart(2, '0'));
              setShowSchedule(true);
            }
          }
          setChat(prev => [...prev, { role: 'ai', content: aiMessage || '' }]);
        }
      } catch {
        setChat(prev => [...prev, { role: 'ai', content: 'Sorry, something went wrong.' }]);
      }
      setInput('');
      setLoading(false);
    };

    // Handle save from GrapesJS
    const handleVisualSave = (html: string) => {
      setDraftMessage(html);
      setShowVisualEditor(false);
      setIsGraphicMessage(true);
    };

    // Helper to check if draftMessage is HTML
    const isHtml = (str: string) => /<([A-Za-z][A-Za-z0-9]*)\b[^>]*>(.*?)<\/\1>/.test(str);

    return (
      <div className="flex flex-col lg:flex-row w-full gap-4 sm:gap-6">
        {/* User Message Section */}
        <form className="w-full lg:w-[60%] flex flex-col mb-4 lg:mb-0" onSubmit={handleFormSubmit}>
          <div className='pt-2 flex flex-col gap-1'>
              <div className="text-sm sm:text-md font-medium mb-1 sm:mb-2">Recipient</div>
              <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} type="email" placeholder="Enter recipient email" className='hover:border-blue-600 focus:ring-blue-600'/>
          </div>
          <div className='pt-2 flex flex-col gap-1'>
              <div className="text-sm sm:text-md font-medium mb-1 sm:mb-2">Subject</div>
              <Input value={draftSubject} onChange={(e) => setDraftSubject(e.target.value)} type="text" placeholder="Enter subject" className='hover:border-blue-600 focus:ring-blue-600'/>
          </div>
          {/* Template selection and visual editor controls */}
          <div className="flex flex-col gap-2 my-2">
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
                className="border rounded bg-gray-50 overflow-y-auto min-h-[60px] max-h-[200px] w-full mb-1 mt-2 cursor-pointer hover:shadow-lg transition-shadow"
                title="Click to edit in Visual Editor"
                onClick={() => setShowVisualEditor(true)}
                tabIndex={0}
                role="button"
                aria-label="Open Visual Editor"
                style={{ outline: 'none' }}
              >
                <ReactShadow.div>
                  <div className="w-full h-full" style={{ maxHeight: 200, overflowY: 'auto' }} dangerouslySetInnerHTML={{ __html: draftMessage }} />
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
                </div> */}
                </div>
                <GrapesJSEditor
                  initialHtml={selectedTemplate?.html || draftMessage}
                  onSave={handleVisualSave}
                  disabled={loading}
                  externalHtml={aiHtml || undefined}
                />
                {aiLoading && <div className="text-blue-600 mt-2">AI is updating the template...</div>}
            </DialogContent>
          </Dialog>
          {/* Message textarea (hide if visual editor or graphic message is active) */}
          {!isGraphicMessage && !showVisualEditor && (
            <div className='pt-2 flex flex-col gap-1'>
                <div className="text-sm sm:text-md font-medium mb-1 sm:mb-2">Your Message</div>
                <TextareaAutosize
                  value={draftMessage}
                  onChange={e => setDraftMessage(e.target.value)}
                  className="w-full border border-input rounded-lg hover:border-blue-600 focus:ring-blue-600 p-2 sm:p-4 min-h-[8rem] sm:min-h-[10rem] text-sm sm:text-base resize-y"
                  placeholder="Write your message here..."
                  minRows={4}
                  maxRows={16}
                />
            </div>
          )}
          {showSchedule && (
            <div className='pt-2 flex flex-col gap-1'>
                <div className="text-sm sm:text-md font-medium mb-1 sm:mb-2">Date & Time</div>
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
                      if (newDay === getMinDate() && !hours.includes(Number(scheduledHour))) {
                        newHour = hours[0]?.toString().padStart(2, '0') ?? '';
                        setScheduledHour(newHour);
                      }
                      const mins = getAvailableMinutes(newDay, newHour);
                      let newMinute = scheduledMinute;
                      // Only auto-correct minute if today and not available
                      if (newDay === getMinDate() && !mins.includes(scheduledMinute)) {
                        newMinute = mins[0] ?? '';
                        setScheduledMinute(newMinute);
                      }
                      if (newDay && newHour && newMinute) {
                        const iso = newDay + 'T' + newHour.padStart(2, '0') + ':' + newMinute.padStart(2, '0') + ':00';
                        if (iso !== date) setDate(iso);
                      }
                    }}
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
                      if (scheduledDay === getMinDate() && !mins.includes(scheduledMinute)) {
                        newMinute = mins[0] ?? '';
                        setScheduledMinute(newMinute);
                      }
                      if (scheduledDay && newHour && newMinute) {
                        const iso = scheduledDay + 'T' + newHour.padStart(2, '0') + ':' + newMinute.padStart(2, '0') + ':00';
                        if (iso !== date) setDate(iso);
                      }
                    }}
                    disabled={!scheduledDay}
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
                    disabled={!scheduledDay || !scheduledHour}
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
                {dateError && <div className="text-xs text-red-500 mt-1">{dateError}</div>}
                {scheduleError && <div className="text-xs text-red-500 mt-1">{scheduleError}</div>}
                {scheduleSuccess && <div className="text-xs text-green-600 mt-1">{scheduleSuccess}</div>}
            </div>
          )}
          {sendError && <div className="text-xs text-red-500 mt-1">{sendError}</div>}
          {sendSuccess && <div className="text-xs text-green-600 mt-1">{sendSuccess}</div>}
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              className="bg-gray-200 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-300 text-sm"
              onClick={() => setShowSchedule(!showSchedule)}
            >
              {showSchedule ? 'Undo Schedule' : 'Schedule'}
            </button>
            {showSchedule ? (
              <button
                type="submit"
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"
                disabled={loading || !scheduledDay || !scheduledHour || !scheduledMinute || !!dateError}
              >
                {loading ? '...' : 'Confirm Schedule'}
              </button>
            ) : (
              <button
                type="submit"
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"
                disabled={loading}
              >
                {loading ? '...' : 'Send'}
              </button>
            )}
          </div>
        </form>
        {/* AI Chat Section */}
        <div className="w-full lg:w-[40%] flex flex-col border-t lg:border-t-0 lg:border-l border-gray-200 pt-4 lg:pt-0 lg:pl-6">
          <div className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">AI Assistant</div>
          <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-2 sm:p-4 mb-2 min-h-[6rem] sm:min-h-[8rem] lg:min-h-0 text-sm sm:text-base">
            {chat.length === 0 ? (
              <div className="text-gray-500">Chat with the AI to improve or modify your message. Suggestions and edits will appear here.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {chat.map((msg, i) => (
                  <div key={i} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
                    <span className={msg.role === 'user' ? 'font-semibold text-blue-600' : 'font-semibold text-green-600'}>
                      {msg.role === 'user' ? 'You' : 'AI'}:
                    </span>{' '}
                    {msg.role === 'ai' ? (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <TextareaAutosize
              minRows={1}
              maxRows={6}
              className="flex-1 border border-input rounded-lg p-2 focus:ring-blue-600 text-sm sm:text-base resize-none"
              placeholder="Ask AI to improve, summarize, etc."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey && !loading) {
                  e.preventDefault();
                  if (input.trim()) {
                    handleSend();
                    setInput(''); // Clear input immediately
                  }
                }
              }}
              disabled={loading}
            />
            <button
              className="bg-blue-600 text-white px-2 sm:px-3 py-2 rounded-lg hover:bg-blue-700 text-sm sm:text-base flex items-center justify-center"
              onClick={() => {
                if (input.trim()) {
                  handleSend();
                  setInput(''); // Clear input immediately
                }
              }}
              disabled={loading || !input.trim()}
              title="Send to AI"
              type="button"
            >
              {loading ? <span className="animate-pulse">...</span> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    )
}

export default MessageDraft