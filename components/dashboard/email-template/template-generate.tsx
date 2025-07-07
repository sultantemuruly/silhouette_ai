import React, { useState } from 'react';

const TemplateGenerate = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [html, setHtml] = useState('');
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setHtml('');
    setName('');
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/ai-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (res.ok && data.html) {
        setHtml(data.html);
      } else {
        setError(data.error || 'Failed to generate template.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaveLoading(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, prompt, html }),
      });
      const data = await res.json();
      if (res.ok && data.template) {
        setSaveSuccess(true);
        setName('');
      } else {
        setSaveError(data.error || 'Failed to save template.');
      }
    } catch {
      setSaveError('Network error.');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <textarea
        className="border rounded p-2 min-h-[80px]"
        placeholder="Describe the email template you want..."
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        disabled={loading || !!html}
      />
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        onClick={handleGenerate}
        disabled={loading || !prompt.trim() || !!html}
      >
        {loading ? 'Generating...' : 'Generate'}
      </button>
      {error && <div className="text-red-600">{error}</div>}
      {html && (
        <div className="flex flex-col gap-4">
          <div>
            <div className="font-semibold mb-2">Preview:</div>
            <div className="border rounded p-4 bg-gray-50 max-h-96 overflow-auto" dangerouslySetInnerHTML={{ __html: html }} />
          </div>
          <input
            className="border rounded p-2"
            placeholder="Template name (required)"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={saveLoading}
            maxLength={128}
          />
          <button
            className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
            onClick={handleSave}
            disabled={saveLoading || !name.trim()}
          >
            {saveLoading ? 'Saving...' : 'Save Template'}
          </button>
          {saveError && <div className="text-red-600">{saveError}</div>}
          {saveSuccess && <div className="text-green-600">Template saved!</div>}
        </div>
      )}
    </div>
  );
};

export default TemplateGenerate;