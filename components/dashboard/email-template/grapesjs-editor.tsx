import React, { useEffect, useRef } from 'react';
import grapesjs from 'grapesjs';
import type { Editor } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';

interface GrapesJSEditorProps {
  initialHtml?: string;
  onSave: (html: string) => void;
  disabled?: boolean;
}

const GrapesJSEditor: React.FC<GrapesJSEditorProps> = ({ initialHtml, onSave, disabled }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const grapesEditor = useRef<Editor | null>(null);

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
            // Only keep the basic commands panel (hide device switcher, etc.)
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
      // Hide the bottom panel (move, device, etc.)
      grapesEditor.current.Panels.getPanel('devices')?.set('visible', false);
      grapesEditor.current.Panels.getPanel('options')?.set('visible', false);
      grapesEditor.current.Panels.getPanel('views')?.set('visible', false);
    }
    return () => {
      grapesEditor.current?.destroy();
      grapesEditor.current = null;
    };
  }, []);

  const handleSave = () => {
    if (grapesEditor.current) {
      const html = grapesEditor.current.getHtml();
      const css = grapesEditor.current.getCss();
      onSave(`<html><head><style>${css}</style></head><body>${html}</body></html>`);
    }
  };

  return (
    <div>
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