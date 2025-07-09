import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';

interface EmailModalProps {
  open: boolean;
  onClose: () => void;
  status: 'pending' | 'sent' | 'failed';
  editMode: boolean;
  editFields: { subject: string; recipient: string; content: string; scheduled_date: string };
  onEditChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onEdit: () => void;
  onDelete: () => void;
  onEditMode: (v: boolean) => void;
  onCancelEdit: () => void;
  error?: string;
}

const GrapesJSEditor = dynamic(() => import('../email-template/grapesjs-editor'), { ssr: false });

// Add a helper to check if a string is HTML
const isHtml = (str: string) => /<([A-Za-z][A-Za-z0-9]*)\b[^>]*>(.*?)<\/\1>/.test(str);

const EmailModal: React.FC<EmailModalProps> = ({
  open,
  onClose,
  status,
  editMode,
  editFields,
  onEditChange,
  onEdit,
  onDelete,
  onEditMode,
  onCancelEdit,
  error,
}) => {
  const isPending = status === 'pending';
  const [scheduledDay, setScheduledDay] = useState('');
  const [scheduledHour, setScheduledHour] = useState('');
  const [scheduledMinute, setScheduledMinute] = useState('');
  const [showVisualEditor, setShowVisualEditor] = useState(false);
  const [visualHtml, setVisualHtml] = useState<string | null>(null);

  useEffect(() => {
    if (editMode && isPending) {
      const d = new Date(editFields.scheduled_date);
      setScheduledDay(d.toISOString().slice(0, 10));
      setScheduledHour(d.getHours().toString().padStart(2, '0'));
      setScheduledMinute(d.getMinutes().toString().padStart(2, '0'));
    }
  }, [editMode, isPending, editFields.scheduled_date]);

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
      const validMinutes = getAvailableMinutes(selectedDate, hour.toString());
      const hours = [];
      if (validMinutes.length > 0) hours.push(hour);
      for (let h = hour + 1; h <= 23; h++) hours.push(h);
      return hours;
    }
    return Array.from({ length: 24 }, (_, i) => i);
  }

  function getAvailableMinutes(selectedDate: string, selectedHour: string) {
    const { hour, minute, date } = getNowParts();
    const mins: string[] = [];
    for (let m = 0; m < 60; m += 5) {
      if (selectedDate === date && parseInt(selectedHour) === hour) {
        if (m > minute + 4) mins.push(m.toString().padStart(2, '0'));
      } else {
        mins.push(m.toString().padStart(2, '0'));
      }
    }
    return mins;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={open => { if (!open) onClose(); }}>
        {/* Hide DialogContent when visual editor is open */}
        {!showVisualEditor && (
          <DialogContent showCloseButton>
            <DialogHeader>
              <DialogTitle>Email Details</DialogTitle>
              <DialogDescription>View or edit the scheduled email details below.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[80vh] overflow-y-auto p-1">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  name="subject"
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={editFields.subject}
                  onChange={onEditChange}
                  readOnly={!isPending || !editMode}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Recipient</label>
                <input
                  type="text"
                  name="recipient"
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={editFields.recipient}
                  onChange={onEditChange}
                  readOnly={!isPending || !editMode}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                {editMode && isPending ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="date"
                      min={getNowParts().date}
                      value={scheduledDay}
                      onChange={e => {
                        const newDay = e.target.value;
                        setScheduledDay(newDay);
                        let newHour = scheduledHour;
                        let newMinute = scheduledMinute;
                        const hours = getAvailableHours(newDay);
                        if (!hours.includes(Number(newHour))) {
                          newHour = hours[0]?.toString().padStart(2, '0') ?? '';
                          setScheduledHour(newHour);
                        }
                        const mins = getAvailableMinutes(newDay, newHour);
                        if (!mins.includes(newMinute)) {
                          newMinute = mins[0] ?? '';
                          setScheduledMinute(newMinute);
                        }
                        if (newDay && newHour && newMinute) {
                          const event = {
                            target: {
                              name: 'scheduled_date',
                              value: `${newDay}T${newHour}:${newMinute}:00`,
                            }
                          } as React.ChangeEvent<HTMLInputElement>;
                          onEditChange(event);
                        }
                      }}
                      className='hover:border-blue-600 focus:ring-blue-600 w-[140px]'
                    />
                    <select
                      value={scheduledHour}
                      onChange={e => {
                        const newHour = e.target.value;
                        setScheduledHour(newHour);
                        let newMinute = scheduledMinute;
                        const mins = getAvailableMinutes(scheduledDay, newHour);
                        if (!mins.includes(newMinute)) {
                          newMinute = mins[0] ?? '';
                          setScheduledMinute(newMinute);
                        }
                        if (scheduledDay && newHour && newMinute) {
                          const event = {
                            target: {
                              name: 'scheduled_date',
                              value: `${scheduledDay}T${newHour}:${newMinute}:00`,
                            }
                          } as React.ChangeEvent<HTMLInputElement>;
                          onEditChange(event);
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
                          const event = {
                            target: {
                              name: 'scheduled_date',
                              value: `${scheduledDay}T${scheduledHour}:${newMinute}:00`,
                            }
                          } as React.ChangeEvent<HTMLInputElement>;
                          onEditChange(event);
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
                ) : (
                  <input
                    type="text"
                    name="scheduled_date"
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={new Date(editFields.scheduled_date).toLocaleString()}
                    readOnly
                  />
                )}
              </div>
              {error && (
                <div className="text-red-500 text-xs mb-2">{error}</div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Content</label>
                <div className="email-message-html" dangerouslySetInnerHTML={{ __html: editFields.content }} />
                {/* Show Edit Message button only in edit mode, next to the message */}
                {isPending && editMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2 mt-2"
                    onClick={() => {
                      const content = editFields.content;
                      setVisualHtml(isHtml(content) ? content : `<div>${content.replace(/\n/g, '<br/>')}</div>`);
                      setShowVisualEditor(true);
                    }}
                  >
                    Edit Message
                  </Button>
                )}
              </div>
              <div className="flex justify-between items-center gap-2 mt-2">
                <div className="flex items-center gap-2">
                  {isPending && !editMode && (
                    <>
                      <Button variant="regular" size="sm" onClick={() => onEditMode(true)}>Edit</Button>
                      <Button variant="destructive" size="sm" onClick={onDelete}>Delete</Button>
                    </>
                  )}
                  {isPending && editMode && (
                    <>
                      <Button variant="regular" size="sm" onClick={onEdit}>Save</Button>
                      <Button variant="outline" size="sm" onClick={onCancelEdit}>Cancel</Button>
                    </>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  status === 'pending' ? 'bg-yellow-200 text-yellow-900' :
                  status === 'sent' ? 'bg-green-200 text-green-900' :
                  'bg-red-200 text-red-900'
                }`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
      {/* Visual Editor Modal rendered outside DialogContent, with high z-index */}
      {showVisualEditor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-4 max-w-3xl w-full relative">
            <div className="flex justify-between items-center mb-2">
              <div className="font-semibold text-lg">Visual Email Editor</div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowVisualEditor(false)}>Close</Button>
              </div>
            </div>
            <GrapesJSEditor
              initialHtml={visualHtml || ''}
              onSave={(html: string) => {
                setShowVisualEditor(false);
                setVisualHtml(html);
                onEditChange({
                  target: {
                    name: 'content',
                    value: html,
                  }
                } as React.ChangeEvent<HTMLInputElement>);
                // Optionally, trigger backend update here if needed
              }}
              disabled={false}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default EmailModal;
