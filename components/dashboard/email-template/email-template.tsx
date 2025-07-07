import { Button } from '@/components/ui/button'
import React, { useState, useEffect } from 'react'
import { EmailTemplateModal } from './email-template-modal'
import TemplateGenerate from './template-generate'

interface EmailTemplateType {
  id: number;
  name: string;
  html: string;
  prompt: string;
  created_at: string;
}

const EmailTemplate = () => {
  const [modalOpen, setModalOpen] = useState(false)
  const [templates, setTemplates] = useState<EmailTemplateType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  return (
    <div className='flex flex-col items-center justify-center h-full'>
        <div className='flex flex-col items-center justify-center gap-4'>
            <h1 className='text-2xl font-bold'>Fancy Template</h1>
            <Button variant='regular' onClick={() => setModalOpen(true)}>Generate Email Template</Button>
        </div>
        <div className='w-full max-w-2xl mt-8'>
          {loading ? (
            <div>Loading templates...</div>
          ) : error ? (
            <div className='text-red-600'>{error}</div>
          ) : templates.length === 0 ? (
            <div className='text-gray-500'>No templates saved yet.</div>
          ) : (
            <div className='grid gap-6'>
              {templates.map(t => (
                <div key={t.id} className='border rounded p-4 bg-white shadow'>
                  <div className='font-semibold mb-2'>{t.name}</div>
                  <div className='text-xs text-gray-400 mb-2'>Created: {new Date(t.created_at).toLocaleString()}</div>
                  <div className='border rounded p-2 bg-gray-50' dangerouslySetInnerHTML={{ __html: t.html }} />
                </div>
              ))}
            </div>
          )}
        </div>
        <EmailTemplateModal open={modalOpen} onClose={() => setModalOpen(false)}>
          <TemplateGenerate />
        </EmailTemplateModal>
    </div>
  )
}

export default EmailTemplate