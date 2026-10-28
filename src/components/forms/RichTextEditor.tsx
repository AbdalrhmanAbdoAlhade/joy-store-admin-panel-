import React, { useRef } from 'react';
import { Bold, Italic, List, ListOrdered, Undo, Redo, Heading2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'اكتب المحتوى بالتفصيل هنا...',
  minHeight = '180px',
  className,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const replacement = `${prefix}${selectedText || 'نص'}${suffix}`;

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText.length || 2));
    }, 0);
  };

  return (
    <div
      className={cn(
        'border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900',
        className
      )}
    >
      {/* Formatting Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
        <button
          type="button"
          onClick={() => applyFormatting('**', '**')}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          title="عريض (Bold)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => applyFormatting('*', '*')}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          title="مائل (Italic)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-1" />
        <button
          type="button"
          onClick={() => applyFormatting('## ')}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          title="عنوان رئيسي (Heading)"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => applyFormatting('\n- ')}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          title="قائمة نقطية (Bullet List)"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => applyFormatting('\n1. ')}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          title="قائمة رقمية (Numbered List)"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
      </div>

      {/* Editor Body */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ minHeight }}
        className="w-full p-3 text-xs leading-relaxed bg-transparent outline-hidden resize-y placeholder:text-slate-400"
      />
    </div>
  );
};

export default RichTextEditor;
