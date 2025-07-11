import React from 'react';
import ReactShadow from 'react-shadow';

interface EmailTemplateModalProps {
  html: string;
}

const EmailTemplateModal: React.FC<EmailTemplateModalProps> = ({ html }) => (
  <div
    style={{
      background: '#fff',
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '900px',
      margin: '40px auto',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    }}
  >
    <ReactShadow.div>
      <div
        style={{ width: '100%', minHeight: 400, maxHeight: 600, borderRadius: 8, overflowY: 'auto' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </ReactShadow.div>
  </div>
);

export default EmailTemplateModal;