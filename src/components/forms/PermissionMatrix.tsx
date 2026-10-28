import React from 'react';
import { PermissionKey, SYSTEM_PERMISSIONS } from '@/src/types/employee';
import { Shield, Check } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface PermissionMatrixProps {
  selectedPermissions: PermissionKey[];
  onChange: (permissions: PermissionKey[]) => void;
  readOnly?: boolean;
}

export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  selectedPermissions,
  onChange,
  readOnly = false,
}) => {
  const isAr = (localStorage.getItem('toy_admin_lang') || 'ar') === 'ar';

  // Group by category
  const categories = Array.from(
    new Set(SYSTEM_PERMISSIONS.map((p) => (isAr ? p.category.ar : p.category.en)))
  );

  const togglePermission = (key: PermissionKey) => {
    if (readOnly) return;
    if (selectedPermissions.includes(key)) {
      onChange(selectedPermissions.filter((k) => k !== key));
    } else {
      onChange([...selectedPermissions, key]);
    }
  };

  const selectAllCategory = (catName: string) => {
    if (readOnly) return;
    const catKeys = SYSTEM_PERMISSIONS.filter(
      (p) => (isAr ? p.category.ar : p.category.en) === catName
    ).map((p) => p.key);

    const allSelected = catKeys.every((k) => selectedPermissions.includes(k));
    if (allSelected) {
      onChange(selectedPermissions.filter((k) => !catKeys.includes(k)));
    } else {
      const merged = Array.from(new Set([...selectedPermissions, ...catKeys]));
      onChange(merged);
    }
  };

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const perms = SYSTEM_PERMISSIONS.filter(
          (p) => (isAr ? p.category.ar : p.category.en) === category
        );
        const allSelected = perms.every((p) => selectedPermissions.includes(p.key));

        return (
          <div
            key={category}
            className="p-4 bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl"
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{category}</h4>
              </div>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => selectAllCategory(category)}
                  className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {allSelected ? 'إلغاء تحديد الكل' : 'تحديد كل القسم'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {perms.map((p) => {
                const checked = selectedPermissions.includes(p.key);
                return (
                  <label
                    key={p.key}
                    onClick={() => togglePermission(p.key)}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer select-none',
                      checked
                        ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800/80'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    )}
                  >
                    <div
                      className={cn(
                        'w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 transition-colors',
                        checked
                          ? 'bg-blue-600 text-white'
                          : 'border border-slate-300 dark:border-slate-600'
                      )}
                    >
                      {checked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {isAr ? p.label.ar : p.label.en}
                      </p>
                      <p className="text-[11px] text-slate-400 leading-normal mt-0.5">
                        {isAr ? p.description.ar : p.description.en}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PermissionMatrix;
