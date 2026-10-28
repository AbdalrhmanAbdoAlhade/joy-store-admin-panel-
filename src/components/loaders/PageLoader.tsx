import React from 'react';
import { cn } from '@/src/lib/utils';

interface PageLoaderProps {
  label?: string;
  className?: string;
}

/**
 * Full-area loading fallback used for route-level code splitting (Suspense)
 * and initial auth checks.
 */
export const PageLoader: React.FC<PageLoaderProps> = ({ label, className }) => {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-20', className)}>
      <span className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      {label && <span className="text-xs text-slate-400">{label}</span>}
    </div>
  );
};

export default PageLoader;
