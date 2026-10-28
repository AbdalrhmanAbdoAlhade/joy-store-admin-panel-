import React, { useState } from 'react';
import { cn } from '@/src/lib/utils';
import { LocalizedString } from '@/src/types/api';

interface LocalizedFieldProps {
  label: string;
  required?: boolean;
  value: LocalizedString | string;
  onChange: (val: LocalizedString) => void;
  isTextarea?: boolean;
  rows?: number;
  placeholderAr?: string;
  placeholderEn?: string;
  errorAr?: string;
  errorEn?: string;
  helperText?: string;
}

export const LocalizedField: React.FC<LocalizedFieldProps> = ({
  label,
  required = false,
  value,
  onChange,
  isTextarea = false,
  rows = 3,
  placeholderAr = 'أدخل النص بالعربية...',
  placeholderEn = 'Enter text in English...',
  errorAr,
  errorEn,
  helperText,
}) => {
  const [activeTab, setActiveTab] = useState<'ar' | 'en'>('ar');

  // Backend may return a plain string (not a localized object).
  const localized: LocalizedString =
    typeof value === 'string' ? { ar: value, en: value } : value || { ar: '', en: '' };

  const handleTextChange = (text: string) => {
    onChange({
      ...localized,
      [activeTab]: text,
    });
  };

  const hasError = (activeTab === 'ar' && !!errorAr) || (activeTab === 'en' && !!errorEn);
  const activeError = activeTab === 'ar' ? errorAr : errorEn;

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
          <span>{label}</span>
          {required && <span className="text-red-500">*</span>}
        </label>

        {/* Tab switcher: AR / EN */}
        <div className="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab('ar')}
            className={cn(
              'px-2.5 py-0.5 text-[11px] font-medium rounded transition-all flex items-center gap-1',
              activeTab === 'ar'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            <span>عربي</span>
            {errorAr && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('en')}
            className={cn(
              'px-2.5 py-0.5 text-[11px] font-medium rounded transition-all flex items-center gap-1',
              activeTab === 'en'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            <span>English</span>
            {errorEn && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
          </button>
        </div>
      </div>

      {isTextarea ? (
        <textarea
          rows={rows}
          value={activeTab === 'ar' ? localized.ar || '' : localized.en || ''}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={activeTab === 'ar' ? placeholderAr : placeholderEn}
          dir={activeTab === 'ar' ? 'rtl' : 'ltr'}
          className={cn(
            'w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border rounded-lg focus:ring-2 outline-hidden transition-colors',
            hasError
              ? 'border-red-400 focus:ring-red-500'
              : 'border-slate-200 dark:border-slate-800 focus:ring-blue-500'
          )}
        />
      ) : (
        <input
          type="text"
          value={activeTab === 'ar' ? localized.ar || '' : localized.en || ''}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={activeTab === 'ar' ? placeholderAr : placeholderEn}
          dir={activeTab === 'ar' ? 'rtl' : 'ltr'}
          className={cn(
            'w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border rounded-lg focus:ring-2 outline-hidden transition-colors',
            hasError
              ? 'border-red-400 focus:ring-red-500'
              : 'border-slate-200 dark:border-slate-800 focus:ring-blue-500'
          )}
        />
      )}

      {activeError && <p className="text-[11px] text-red-500">{activeError}</p>}
      {helperText && !activeError && <p className="text-[11px] text-slate-400">{helperText}</p>}
    </div>
  );
};

export default LocalizedField;
