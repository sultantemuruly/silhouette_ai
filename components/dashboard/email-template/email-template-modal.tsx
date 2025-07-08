import React from 'react';

interface EmailTemplateModalProps {
  html: string;
  id: number | string;
}

const EmailTemplateModal: React.FC<EmailTemplateModalProps> = ({ html, id }) => (
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
    <iframe
      srcDoc={html}
      style={{ width: '100%', border: 'none', minHeight: 400, borderRadius: 8 }}
      sandbox=""
      title={`template-modal-${id}`}
    />
  </div>
);

export default EmailTemplateModal;