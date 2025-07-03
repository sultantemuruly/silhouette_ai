import React, { useState } from 'react'
import { useMessageStore } from '@/stores/useMessageStore'
import ReactMarkdown from 'react-markdown';
import TextareaAutosize from 'react-textarea-autosize';

import { Input } from '@/components/ui/input';

const MessageDraft = () => {
    const { draftMessage, setDraftMessage } = useMessageStore() as {draftMessage: string, setDraftMessage: (draftMessage: string) => void};
    const { draftSubject, setDraftSubject } = useMessageStore() as {draftSubject: string, setDraftSubject: (draftSubject: string) => void};

    // AI chat state
    const [chat, setChat] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

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
        <div className="w-full lg:w-[60%] flex flex-col mb-4 lg:mb-0">
          <div className='pt-2 flex flex-col gap-1'>
              <div className="text-sm sm:text-md font-medium mb-1 sm:mb-2">Subject</div>
              <Input value={draftSubject} onChange={(e) => setDraftSubject(e.target.value)} type="text" placeholder="Enter subject" className='hover:border-blue-600 focus:ring-blue-600'/>
          </div>
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
        </div>
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
              className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 text-sm sm:text-base"
              onClick={handleSend}
              disabled={loading || !input.trim()}
            >
              {loading ? '...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    )
}

export default MessageDraft