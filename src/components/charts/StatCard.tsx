import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  changePercentage?: number;
  changeLabel?: string;
  icon: LucideIcon;
  subtitle?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  changePercentage,
  changeLabel = 'مقارنة بالفترة السابقة',
  icon: Icon,
  subtitle,
  className,
}) => {
  const isPositive = (changePercentage ?? 0) >= 0;

  return (
    <div
      className={cn(
        'p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700 flex flex-col justify-between',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <h3 className="text-2xl font-bold font-mono tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
            {value}
          </h3>
        </div>
        <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
        {changePercentage !== undefined ? (
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-bold font-mono tabular-nums text-xs',
                isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              )}
            >
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {Math.abs(changePercentage)}%
            </span>
            <span className="text-slate-400 text-[11px] truncate">{changeLabel}</span>
          </div>
        ) : (
          <span className="text-slate-400 text-[11px]">{subtitle}</span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
