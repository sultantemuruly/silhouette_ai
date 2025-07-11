import React from 'react';
import ReactShadow from 'react-shadow';

interface TemplateCardProps {
  name: string;
  html: string;
  prompt: string;
  first_name: string;
  last_name: string;
  onClick?: () => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({ name, html, prompt, first_name, last_name, onClick }) => {
  return (
    <div
      className="border rounded-lg shadow p-4 bg-white flex flex-col gap-2 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <div className="font-semibold text-lg">{name}</div>
      <div className="text-sm text-gray-500 mb-1">By: {first_name} {last_name}</div>
      <div className="text-xs text-gray-700 mb-2 italic">Prompt: {prompt}</div>
      <div className="border rounded bg-gray-50 p-2 overflow-auto" style={{ minHeight: 80, maxHeight: 200 }}>
        <ReactShadow.div>
          <div style={{ width: '100%', height: '100%', maxHeight: 200, overflowY: 'auto' }} dangerouslySetInnerHTML={{ __html: html }} />
        </ReactShadow.div>
      </div>
    </div>
  );
}; 