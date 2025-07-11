import { Button } from '@/components/ui/button'
import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic';
import TemplateGenerate from './template-generate'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import ReactShadow from 'react-shadow';

const GrapesJSEditor = dynamic(() => import('./grapesjs-editor'), { ssr: false });

interface EmailTemplateType {
  id: number;
  name: string;
  html: string;
  prompt: string;
  created_at: string;
  is_public?: boolean;
}

// Add a type for the global property
interface WindowWithTemplate extends Window {
  _originalTemplateHtml?: string;
}

const EmailTemplate = () => {
  const [modalOpen, setModalOpen] = useState(false)
  const [templates, setTemplates] = useState<EmailTemplateType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplateType | null>(null);

  // Debug: log the current previewTemplate whenever it changes
  console.log('Current previewTemplate:', previewTemplate);

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch('/api/email-templates')
        const data = await res.json()
        if (res.ok && data.templates) {
          setTemplates(data.templates)
        } else {
          setError(data.error || 'Failed to fetch templates.')
        }
      } catch {
        setError('Network error.')
      } finally {
        setLoading(false)
      }
    }
    fetchTemplates()
  }, [modalOpen]) // refetch when modal closes (after save)

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      const res = await fetch('/api/email-templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setTemplates(templates => templates.filter(t => t.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete template.');
      }
    } catch {
      alert('Network error.');
    }
  };

  const startEdit = (t: EmailTemplateType) => {
    setEditingId(t.id);
    setEditName(t.name);
    // Store the original template for injection on save
    (window as WindowWithTemplate)._originalTemplateHtml = t.html;
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  return (
    <div className='flex flex-col items-center min-h-screen w-full bg-gray-50'>
      {/* Persistent module title */}
      <div className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 mt-4 w-full max-w-2xl px-2">Fancy Template</div>
      {/* Header Row */}
      <div className='w-full max-w-2xl flex items-center justify-between mt-12 mb-8 px-2'>
        <h1 className='text-3xl font-bold text-gray-900'>Email Templates</h1>
        <Button variant='regular' onClick={() => setModalOpen(true)}>
          New Template
        </Button>
      </div>
      {/* Template List */}
      <div className='w-full max-w-2xl'>
        {loading ? (
          <div>Loading templates...</div>
        ) : error ? (
          <div className='text-red-600'>{error}</div>
        ) : templates.length === 0 ? (
          <div className='text-gray-500'>No templates saved yet.</div>
        ) : (
          <div className='grid gap-4'>
            {templates.map(t => {
              return (
                <div key={t.id} className='border rounded p-3 bg-white shadow flex flex-col relative'>
                  <div className='flex justify-between items-start mb-2'>
                    <div className='flex flex-col gap-1'>
                      <div className='font-semibold'>{t.name}</div>
                      <div className='text-xs text-gray-400'>Created: {new Date(t.created_at).toLocaleString()}</div>
                    </div>
                    <div className='flex flex-col gap-2 items-end'>
                      <Button
                        size='sm'
                        variant={t.is_public ? 'secondary' : 'regular'}
                        onClick={async () => {
                          const newVal = !t.is_public;
                          const res = await fetch('/api/email-templates', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: t.id, is_public: newVal }),
                          });
                          const data = await res.json();
                          if (res.ok && data.template) {
                            setTemplates(templates => templates.map(temp => temp.id === t.id ? { ...temp, is_public: newVal } : temp));
                          } else {
                            alert(data.error || 'Failed to update template visibility.');
                          }
                        }}
                      >
                        {t.is_public ? 'Remove from Marketplace' : 'Send to Marketplace'}
                      </Button>
                    </div>
                  </div>
                  <div
                    className='relative border rounded bg-gray-50 w-full flex-1 cursor-pointer hover:shadow-lg transition-shadow'
                    style={{ minHeight: 80, maxHeight: 200, padding: 8 }}
                    title='Click to preview this template'
                    onClick={() => setPreviewTemplate(t)}
                    tabIndex={0}
                    role="button"
                    aria-label="Preview Template"
                  >
                    <ReactShadow.div>
                      <div
                        style={{ width: '100%', height: '100%', maxHeight: 200, overflowY: 'auto' }}
                        dangerouslySetInnerHTML={{ __html: t.html }}
                      />
                    </ReactShadow.div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Edit Inline (if any) */}
      {editingId && (
        <Dialog open={!!editingId} onOpenChange={cancelEdit}>
          <DialogContent>
            <DialogTitle>Edit Template</DialogTitle>
            <div className='flex flex-col gap-2'>
              <input
                className='border rounded p-2 font-semibold'
                value={editName}
                onChange={e => setEditName(e.target.value)}
                disabled={editLoading}
                maxLength={128}
              />
              <GrapesJSEditor
                initialHtml={templates.find(t => t.id === editingId)?.html}
                onSave={async (newHtml) => {
                  setEditLoading(true);
                  try {
                    const res = await fetch('/api/email-templates', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: editingId, name: editName, html: newHtml }),
                    });
                    const data = await res.json();
                    if (res.ok && data.template) {
                      setTemplates(templates => templates.map(t => t.id === editingId ? { ...t, name: data.template.name, html: data.template.html } : t));
                      cancelEdit();
                    } else {
                      alert(data.error || 'Failed to update template.');
                    }
                  } catch {
                    alert('Network error.');
                  } finally {
                    setEditLoading(false);
                  }
                }}
                disabled={editLoading}
              />
              <div className='flex gap-2 mt-2'>
                {/* Save button is now in GrapesJSEditor */}
                <Button size='sm' variant='outline' onClick={cancelEdit} disabled={editLoading}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent showCloseButton>
          {previewTemplate && (
            <>
              <DialogTitle>{previewTemplate.name}</DialogTitle>
              <div className='flex flex-col gap-4 items-center'>
                <div className='w-full border rounded p-4 bg-gray-50 max-h-[60vh] overflow-auto' dangerouslySetInnerHTML={{ __html: previewTemplate.html }} />
                <div className='flex gap-2 mt-2'>
                  <Button size='sm' onClick={() => { startEdit(previewTemplate); setPreviewTemplate(null); }}>Edit</Button>
                  <Button variant='destructive' size='sm' onClick={() => { handleDelete(previewTemplate.id); setPreviewTemplate(null); }}>Delete</Button>
                  {/* <Button variant='outline' onClick={() => setPreviewTemplate(null)}>Exit</Button> */}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      {/* New Template Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogTitle>New Template</DialogTitle>
          <TemplateGenerate />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default EmailTemplate