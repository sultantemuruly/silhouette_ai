import React, { useEffect, useRef, useState } from 'react';
import grapesjs from 'grapesjs';
import type { Editor } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
// @ts-expect-error: No types for html2pdf.js
import html2pdf from 'html2pdf.js';
// @ts-expect-error: No types for html-docx-js
import htmlDocx from 'html-docx-js/dist/html-docx';
import html2canvas from 'html2canvas';

interface GrapesJSEditorProps {
  initialHtml?: string;
  onSave: (html: string) => void;
  disabled?: boolean;
}

const GrapesJSEditor: React.FC<GrapesJSEditorProps> = ({ initialHtml, onSave, disabled }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const grapesEditor = useRef<Editor | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

  useEffect(() => {
    if (editorRef.current && !grapesEditor.current) {
      grapesEditor.current = grapesjs.init({
        container: editorRef.current,
        fromElement: false,
        height: '500px',
        width: '100%',
        storageManager: false,
        components: initialHtml || '',
        style: '',
        panels: {
          defaults: [
            {
              id: 'commands',
              buttons: [
                {
                  id: 'undo',
                  className: 'fa fa-undo',
                  command: 'core:undo',
                  attributes: { title: 'Undo' },
                },
                {
                  id: 'redo',
                  className: 'fa fa-repeat',
                  command: 'core:redo',
                  attributes: { title: 'Redo' },
                },
              ],
            },
          ],
        },
      });
      grapesEditor.current.Panels.getPanel('devices')?.set('visible', false);
      grapesEditor.current.Panels.getPanel('options')?.set('visible', false);
      grapesEditor.current.Panels.getPanel('views')?.set('visible', false);

      // Add custom blocks for email templates
      const bm = grapesEditor.current.BlockManager;
      bm.add('email-header', {
        label: 'Header',
        category: 'Email',
        content: `
          <table class="email-header" width="100%" cellpadding="0" cellspacing="0" style="background:#007BFF;color:#fff;text-align:center;padding:20px 0;">
            <tr><td><h1 style="margin:0;font-size:24px;">Your Company</h1></td></tr>
          </table>
        `,
      });
      bm.add('email-footer', {
        label: 'Footer',
        category: 'Email',
        content: `
          <table class="email-footer" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;text-align:center;padding:10px 0;font-size:12px;color:#666;">
            <tr><td>&copy; 2023 Your Company. All rights reserved.</td></tr>
          </table>
        `,
      });
      bm.add('email-button', {
        label: 'Button',
        category: 'Email',
        content: `
          <a href="#" style="display:inline-block;padding:10px 20px;background:#007BFF;color:#fff;text-decoration:none;border-radius:5px;font-size:16px;">Click Me</a>
        `,
      });
      bm.add('email-image', {
        label: 'Image',
        category: 'Email',
        content: `
          <img src="https://via.placeholder.com/600x200" alt="Image" style="max-width:100%;height:auto;display:block;margin:0 auto;" />
        `,
      });
      bm.add('email-text', {
        label: 'Text',
        category: 'Email',
        content: `
          <div style="font-size:16px;color:#333;line-height:1.6;">Your text here...</div>
        `,
      });
      bm.add('email-divider', {
        label: 'Divider',
        category: 'Email',
        content: `
          <hr style="border:0;border-top:1px solid #ddd;margin:20px 0;" />
        `,
      });
    }
    return () => {
      grapesEditor.current?.destroy();
      grapesEditor.current = null;
    };
  }, []);

  const getHtmlAndCss = () => {
    if (!grapesEditor.current) return { html: '', css: '' };
    const html = grapesEditor.current.getHtml();
    const css = grapesEditor.current.getCss();
    return { html, css };
  };

  const handleExport = async (type: string) => {
    setShowExportMenu(false);
    if (!grapesEditor.current) return;
    setExporting(true);
    const { html, css } = getHtmlAndCss();
    const fullHtml = `<html><head><style>${css}</style></head><body>${html}</body></html>`;
    try {
      if (type === 'html') {
        const blob = new Blob([fullHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'template.html';
        a.click();
        URL.revokeObjectURL(url);
      } else if (type === 'pdf') {
        const iframe = document.createElement('iframe');
        document.body.appendChild(iframe);
        iframe.style.display = 'none';
        iframe.srcdoc = fullHtml;
        await new Promise(resolve => setTimeout(resolve, 500));
        await html2pdf().from(iframe.contentDocument!.body).set({ filename: 'template.pdf' }).save();
        document.body.removeChild(iframe);
      } else if (type === 'eml') {
        const eml = `Subject: My Email\nContent-Type: text/html; charset=UTF-8\n\n${fullHtml}`;
        const blob = new Blob([eml], { type: 'message/rfc822' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'template.eml';
        a.click();
        URL.revokeObjectURL(url);
      } else if (type === 'docx') {
        const docxBlob = htmlDocx.asBlob(fullHtml);
        const url = URL.createObjectURL(docxBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'template.docx';
        a.click();
        URL.revokeObjectURL(url);
      } else if (type === 'image') {
        // Render the HTML to a temporary div for html2canvas
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'fixed';
        tempDiv.style.left = '-9999px';
        tempDiv.innerHTML = fullHtml;
        document.body.appendChild(tempDiv);
        await html2canvas(tempDiv, { useCORS: true }).then(canvas => {
          const link = document.createElement('a');
          link.download = 'template.png';
          link.href = canvas.toDataURL();
          link.click();
        });
        document.body.removeChild(tempDiv);
      }
    } finally {
      setExporting(false);
    }
  };

  const handleSave = () => {
    if (grapesEditor.current) {
      const html = grapesEditor.current.getHtml();
      const css = grapesEditor.current.getCss();
      onSave(`<html><head><style>${css}</style></head><body>${html}</body></html>`);
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-2 gap-2">
        <div className="relative inline-block text-left" ref={exportMenuRef}>
          <button
            className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm font-medium"
            disabled={exporting}
            type="button"
            id="export-menu"
            aria-haspopup="true"
            aria-expanded={showExportMenu}
            onClick={() => setShowExportMenu(v => !v)}
          >
            Export ▼
          </button>
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10" style={{ minWidth: '8rem' }}>
              <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" onClick={() => handleExport('html')}>Export as HTML</button>
              <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" onClick={() => handleExport('pdf')}>Export as PDF</button>
              <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" onClick={() => handleExport('eml')}>Export as EML</button>
              <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" onClick={() => handleExport('docx')}>Export as DOCX</button>
              <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" onClick={() => handleExport('image')}>Export as Image</button>
            </div>
          )}
        </div>
      </div>
      <div
        ref={editorRef}
        style={{
          minHeight: '500px',
          maxHeight: '500px',
          overflow: 'auto',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          background: '#fff',
          marginBottom: '1rem',
        }}
      />
      <button
        onClick={handleSave}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
        disabled={disabled}
      >
        Save
      </button>
    </div>
  );
};

export default GrapesJSEditor; 