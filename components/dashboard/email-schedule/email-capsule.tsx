import React from 'react'

interface EmailCapsuleProps {
  date: string;
  title: string;
  recipient: string;
  content: string;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getSnippet(content: string, maxLength = 80) {
  return content.length > maxLength ? content.slice(0, maxLength) + '…' : content;
}

const EmailCapsule: React.FC<EmailCapsuleProps> = ({ date, title, recipient, content }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col justify-between h-48 border border-gray-100 hover:shadow-md transition-shadow duration-200">
      <div className="mb-2 text-xs text-gray-500">{formatDate(date)}</div>
      <div className="font-semibold text-base mb-1 truncate" title={title}>{title}</div>
      <div className="text-sm text-gray-600 mb-2 truncate" title={recipient}>To: {recipient}</div>
      <div className="text-sm text-gray-700 flex-1 overflow-hidden">
        {getSnippet(content)}
      </div>
    </div>
  )
}

export default EmailCapsule