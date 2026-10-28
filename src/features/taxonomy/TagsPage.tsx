import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { taxonomyService } from '@/src/services/taxonomyService';
import { localizedText } from '@/src/lib/api-helpers';
import { Tags as TagsIcon } from 'lucide-react';

export const TagsPage: React.FC = () => {
  const isAr = (localStorage.getItem('toy_admin_lang') || 'ar') === 'ar';

  const { data: tagsRes } = useQuery({
    queryKey: ['taxonomy', 'tags'],
    queryFn: () => taxonomyService.getTags(),
  });

  const tags = tagsRes?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          الوسوم والمجموعات (Tags & Collections)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          وسوم تسويقية مميزة للألعاب مثل: وصل حديثاً، صديق للبيئة، تنمية الذكاء
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span
                className="w-3.5 h-3.5 rounded-full"
                style={{ backgroundColor: tag.color || '#3B82F6' }}
              />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {localizedText(tag.name, isAr ? 'ar' : 'en')}
                </p>
                <p className="text-[11px] text-slate-400 font-mono">{tag.slug}</p>
              </div>
            </div>

            <span className="text-xs font-mono tabular-nums text-slate-500 font-semibold">
              {tag.products_count || 0} منتج
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TagsPage;
