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

const PAGE_SIZE = 10;

const TemplateMarketplace = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/email-templates/marketplace?page=${page}&limit=${PAGE_SIZE}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch templates');
        return res.json();
      })
      .then(data => {
        setTemplates(data.templates);
        setTotal(data.total);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [page]);

  const handleCardClick = (template: Template) => {
    setSelectedTemplate(template);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTemplate(null);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (loading) return <div>Loading templates...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <>
      {/* Pagination Bar */}
      <div className="w-full max-w-5xl mx-auto flex justify-center mt-4 mb-8">
        <div className="bg-white/90 shadow-lg rounded-lg px-3 py-1.5 flex items-center gap-3">
          <button
            className="px-2 py-1 rounded border bg-white text-gray-700 font-medium shadow-sm transition hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="text-gray-700 font-normal text-base">Page {page} of {totalPages || 1}</span>
          <button
            className="px-2 py-1 rounded border bg-white text-gray-700 font-medium shadow-sm transition hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
          >
            Next
          </button>
        </div>
      </div>
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