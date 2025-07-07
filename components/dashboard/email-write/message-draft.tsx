import React, { useState } from 'react'
import { useRecipient, useSetRecipient, useSetDate, useDate, useMessageStore, useShowSchedule, useSetShowSchedule } from '@/stores/useMessageStore'
import ReactMarkdown from 'react-markdown';
import TextareaAutosize from 'react-textarea-autosize';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';

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

    // Helper: Try to extract subject/body from AI reply (robust for markdown)
    function parseAIReply(reply: string) {
      // Match both markdown (**Subject:**) and plain (Subject:)
      const subjectRegex = /\*\*?Subject:?\*\*?\s*:?\s*(.*)/i;
      const bodyRegex = /\*\*?Body:?\*\*?\s*:?\s*([\s\S]*)/i;
      const subjectMatch = reply.match(subjectRegex);
      const bodyMatch = reply.match(bodyRegex);
      // If both present, ensure body is after subject
      if (subjectMatch && bodyMatch) {
        // If body comes after subject, extract accordingly
        const subject = subjectMatch[1].split(/\*\*?Body:?\*\*?/i)[0].trim();
        const body = bodyMatch[1].trim();
        return { subject, body };
      }
      if (bodyMatch) {
        return { subject: undefined, body: bodyMatch[1].trim() };
      }
      if (subjectMatch) {
        return { subject: subjectMatch[1].trim(), body: undefined };
      }
      return null;
    }

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

    const handleFormSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSendError(null);
      setSendSuccess(null);
      setScheduleError(null);
      setScheduleSuccess(null);
      if (showSchedule) {
        // Schedule validation (same as before)
        if (!recipient || !draftSubject || !draftMessage || !scheduledDay || scheduledHour === "" || scheduledMinute === "") {
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
              content: draftMessage,
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
        // Send validation
        if (!recipient || !draftSubject || !draftMessage) {
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
              content: draftMessage,
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
      setChat(prev => [...prev, { role: 'user', content: input }]);
      try {
        const res = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: input, subject: draftSubject, body: draftMessage }),
        });
        const data = await res.json();
        const aiContent = data.reply || '';
        // Try to parse for subject/body
        const parsed = parseAIReply(aiContent);
        if (parsed) {
          if (parsed.subject) setDraftSubject(parsed.subject);
          if (parsed.body) setDraftMessage(parsed.body);
        }
        setChat(prev => [...prev, { role: 'ai', content: aiContent }]);
      } catch {
        setChat(prev => [...prev, { role: 'ai', content: 'Sorry, something went wrong.' }]);
      }
      setInput('');
      setLoading(false);
    };

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
                      // Update store
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
            <input
              type="text"
              className="flex-1 border border-input rounded-lg p-2 focus:ring-blue-600 text-sm sm:text-base"
              placeholder="Ask AI to improve, summarize, etc."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !loading) handleSend(); }}
              disabled={loading}
            />
            <button
              className="bg-blue-600 text-white px-2 sm:px-3 py-2 rounded-lg hover:bg-blue-700 text-sm sm:text-base flex items-center justify-center"
              onClick={handleSend}
              disabled={loading || !input.trim()}
              title="Send to AI"
            >
              {loading ? <span className="animate-pulse">...</span> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    )
}

export default MessageDraft