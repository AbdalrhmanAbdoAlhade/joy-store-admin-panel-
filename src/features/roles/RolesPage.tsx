import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Pencil, X, Check } from 'lucide-react';
import { roleService } from '@/src/services/roleService';
import { Role } from '@/src/types/role';
import { toast } from 'sonner';

const GROUP_LABELS: Record<string, string> = {
  orders: 'الطلبات',
  products: 'المنتجات',
  inventory: 'المخزون',
  reviews: 'التقييمات',
  tickets: 'الدعم الفني',
  returns: 'المرتجعات',
  coupons: 'الكوبونات',
  general: 'عام',
};

interface PermissionGroup {
  group: string;
  label: string;
  permissions: { id: string; name: string }[];
}

export const RolesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  const { data: rolesRes, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => roleService.getRoles(),
  });

  const { data: permsRes } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => roleService.getPermissions(),
  });

  const roles = rolesRes?.data || [];
  const permissions = permsRes?.data || [];

  const groups: PermissionGroup[] = useMemo(() => {
    const map = new Map<string, PermissionGroup>();
    permissions.forEach((p) => {
      const key = p.group || 'general';
      if (!map.has(key)) {
        map.set(key, { group: key, label: GROUP_LABELS[key] || key, permissions: [] });
      }
      map.get(key)!.permissions.push({ id: String(p.id), name: p.name });
    });
    return Array.from(map.values());
  }, [permissions]);

  const saveMutation = useMutation({
    mutationFn: ({ roleId, perms }: { roleId: number | string; perms: string[] }) =>
      roleService.updateRolePermissions(roleId, perms),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success(res.message || 'تم تحديث الصلاحيات بنجاح');
      closeModal();
    },
    // Errors (401/403/422/500) are surfaced by the global axios interceptor.
  });

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setSelected(role.permissions || []);
  };

  const closeModal = () => {
    setEditingRole(null);
    setSelected([]);
  };

  const togglePermission = (name: string) => {
    setSelected((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  };

  const allNames = permissions.map((p) => p.name);
  const selectAll = () => setSelected(allNames);
  const clearAll = () => setSelected([]);

  const handleSave = () => {
    if (!editingRole) return;
    if (selected.length === 0) {
      toast.error('يجب اختيار صلاحية واحدة على الأقل (الخادم لا يقبل قائمة صلاحيات فارغة)');
      return;
    }
    saveMutation.mutate({ roleId: editingRole.id, perms: selected });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          الأدوار والصلاحيات (Roles &amp; Permissions)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          إدارة صلاحيات كل دور (Admin / Employee / User) والتحكم في وصول الموظفين للنظام
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500">
            <tr>
              <th className="text-start px-4 py-3 font-semibold">الدور</th>
              <th className="text-start px-4 py-3 font-semibold">عدد الصلاحيات</th>
              <th className="text-start px-4 py-3 font-semibold">المستخدمون</th>
              <th className="text-end px-4 py-3 font-semibold">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {roles.map((role) => (
              <tr key={role.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-bold uppercase text-slate-800 dark:text-slate-200">{role.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                    {role.permissions?.length ?? 0} صلاحية
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {role.users_count != null ? role.users_count : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => openEdit(role)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      تعديل الصلاحيات
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && roles.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                  لا توجد أدوار
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xl space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                صلاحيات دور: <span className="uppercase">{editingRole.name}</span>
              </h3>
              <button onClick={closeModal} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-blue-600 border border-blue-200 dark:border-blue-900 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40"
              >
                <Check className="w-3.5 h-3.5" />
                تحديد الكل
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="px-3 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                إلغاء الكل
              </button>
              <span className="ms-auto text-slate-400">
                المحدد: <span className="font-bold text-slate-600 dark:text-slate-300">{selected.length}</span> / {allNames.length}
              </span>
            </div>

            <div className="space-y-4">
              {groups.map((g) => (
                <div key={g.group} className="border border-slate-100 dark:border-slate-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      {g.label} <span className="text-slate-400">({g.group})</span>
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {g.permissions.map((p) => (
                      <label
                        key={p.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selected.includes(p.name)}
                          onChange={() => togglePermission(p.name)}
                          className="w-4 h-4 rounded"
                        />
                        <span className="font-mono text-slate-700 dark:text-slate-300">{p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-1.5 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-70"
              >
                {saveMutation.isPending && (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                حفظ الصلاحيات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesPage;
