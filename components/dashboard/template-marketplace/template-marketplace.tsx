import React, { useEffect, useState } from 'react';
import { TemplateCard } from './template-card';
import { TemplateMarketplaceModal } from './template-marketplace-modal';

interface Template {
  id: number;
  name: string;
  html: string;
  prompt: string;
  first_name: string;
  last_name: string;
}

const TemplateMarketplace = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  useEffect(() => {
    fetch('/api/email-templates/marketplace')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch templates');
        return res.json();
      })
      .then(data => {
        setTemplates(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleCardClick = (template: Template) => {
    setSelectedTemplate(template);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTemplate(null);
  };

  if (loading) return <div>Loading templates...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {templates.map(t => (
          <TemplateCard key={t.id} {...t} onClick={() => handleCardClick(t)} />
        ))}
      </div>
      {selectedTemplate && (
        <TemplateMarketplaceModal
          open={modalOpen}
          onClose={handleCloseModal}
          name={selectedTemplate.name}
          html={selectedTemplate.html}
          prompt={selectedTemplate.prompt}
          first_name={selectedTemplate.first_name}
          last_name={selectedTemplate.last_name}
        />
      )}
    </>
  );
};

export default TemplateMarketplace;