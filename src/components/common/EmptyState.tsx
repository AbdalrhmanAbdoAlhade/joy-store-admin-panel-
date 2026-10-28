import React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface EmptyStateProps {
  message?: string;
  description?: string;
  icon?: React.ElementType;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message = 'لا توجد بيانات',
  description,
  icon: Icon = Inbox,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 py-10 text-center',
        className
      )}
    >
      <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{message}</p>
      {description && <p className="text-[11px] text-slate-400">{description}</p>}
    </div>
  );
};

export default EmptyState;
