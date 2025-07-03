import React from 'react'
import { useMessageStore } from '@/stores/useMessageStore'

import { Input } from '@/components/ui/input';

const MessageDraft = () => {
    const { draftMessage, setDraftMessage } = useMessageStore() as {draftMessage: string, setDraftMessage: (draftMessage: string) => void};
    const { draftTitle, setDraftTitle } = useMessageStore() as {draftTitle: string, setDraftTitle: (draftTitle: string) => void};

  return (
    <div className="flex flex-col lg:flex-row w-full h-auto lg:h-[32rem] gap-4 sm:gap-6">
      {/* User Message Section */}
      <div className="w-full lg:w-[60%] flex flex-col mb-4 lg:mb-0">
        <div className='flex flex-col gap-2'>
            <div className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">Title</div>
            <Input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} type="text" placeholder="Enter subject" className='hover:border-blue-600 focus:ring-blue-600'/>
        </div>
        <div className='flex flex-col gap-2'>
            <div className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">Your Message</div>
            <textarea value={draftMessage} onChange={(e) => setDraftMessage(e.target.value)} className="w-full flex-1 border border-input rounded-lg hover:border-blue-600 focus:ring-blue-600 p-2 sm:p-4 resize-none min-h-[8rem] sm:min-h-[10rem] lg:min-h-0 text-sm sm:text-base" placeholder="Write your message here..." />
        </div>
      </div>
      {/* AI Chat Section */}
      <div className="w-full lg:w-[40%] flex flex-col border-t lg:border-t-0 lg:border-l border-gray-200 pt-4 lg:pt-0 lg:pl-6">
        <div className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">AI Assistant</div>
        <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-2 sm:p-4 mb-2 min-h-[6rem] sm:min-h-[8rem] lg:min-h-0 text-sm sm:text-base">
          {/* Placeholder for AI chat messages */}
          <div className="text-gray-500">Chat with the AI to improve or modify your message. Suggestions and edits will appear here.</div>
        </div>
        <div className="flex gap-2">
          <input type="text" className="flex-1 border border-input rounded-lg p-2 focus:ring-blue-600 text-sm sm:text-base" placeholder="Ask AI to improve, summarize, etc." />
          <button className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 text-sm sm:text-base">Send</button>
        </div>
      </div>
    </div>
  )
}

export default MessageDraft