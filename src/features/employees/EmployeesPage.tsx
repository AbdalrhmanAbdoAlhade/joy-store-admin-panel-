import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserCheck, Plus, Trash2, Shield, Edit } from 'lucide-react';
import { employeeService } from '@/src/services/employeeService';
import { Employee, PermissionKey } from '@/src/types/employee';
import PermissionMatrix from '@/src/components/forms/PermissionMatrix';
import ConfirmDialog from '@/src/components/common/ConfirmDialog';
import StatusBadge from '@/src/components/common/StatusBadge';
import { toast } from 'sonner';

export const EmployeesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [deleteId, setDeleteId] = useState<number | string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'employee'>('employee');
  const [permissions, setPermissions] = useState<PermissionKey[]>(['orders.view']);

  const { data: employeesRes, isLoading } = useQuery({
    queryKey: ['employees', 'list'],
    queryFn: () => employeeService.getEmployees(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Employee> & { password?: string }) => employeeService.createEmployee(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('تمت إضافة الموظف بنجاح وتعيين الصلاحيات');
      setModalOpen(false);
      resetForm();
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: ({ id, perms }: { id: number | string; perms: PermissionKey[] }) =>
      employeeService.updatePermissions(id, perms),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('تم تحديث مصفوفة الصلاحيات للموظف');
      setModalOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => employeeService.deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('تم حذف الموظف بنجاح');
      setDeleteId(null);
    },
  });

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('employee');
    setPermissions(['orders.view']);
    setEditingEmp(null);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmp(emp);
    setName(emp.name);
    setEmail(emp.email);
    setRole(emp.role);
    setPermissions(emp.permissions || []);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error('يرجى إدخال اسم الموظف والبريد الإلكتروني');
      return;
    }

    if (!editingEmp && password.length < 8) {
      toast.error('يرجى إدخال كلمة مرور لا تقل عن 8 أحرف');
      return;
    }

    if (editingEmp) {
      updatePermissionsMutation.mutate({ id: editingEmp.id, perms: permissions });
    } else {
      createMutation.mutate({ name, email, password, role, permissions });
    }
  };

  const employees = employeesRes?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            فريق العمل ومصفوفة الصلاحيات
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            إدارة حسابات موظفي المتجر والتحكم الدقيق في صلاحيات كل موظف (RBAC)
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة موظف جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map((emp) => (
          <div
            key={emp.id}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-sm">
                    {emp.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {emp.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">{emp.email}</p>
                  </div>
                </div>

                <StatusBadge
                  label={emp.role === 'admin' ? 'مدير نظام' : 'موظف'}
                  variant={emp.role === 'admin' ? 'purple' : 'info'}
                />
              </div>

              <div className="pt-2">
                <p className="text-[11px] text-slate-500 font-medium mb-1.5">
                  الصلاحيات المفعلة ({emp.role === 'admin' ? 'صلاحيات كاملة *' : `${emp.permissions.length} صلاحيات`}):
                </p>
                <div className="flex flex-wrap gap-1">
                  {emp.role === 'admin' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      كل الصلاحيات الإدارية مفعلة تلقائياً
                    </span>
                  ) : (
                    emp.permissions.slice(0, 5).map((p) => (
                      <span
                        key={p}
                        className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono"
                      >
                        {p}
                      </span>
                    ))
                  )}
                  {emp.role !== 'admin' && emp.permissions.length > 5 && (
                    <span className="text-[10px] text-slate-400 px-1">
                      +{emp.permissions.length - 5} أخرى
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400">آخر نشاط: {emp.last_active_at || 'منذ قليل'}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(emp)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md"
                  title="تعديل الصلاحيات"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                {emp.role !== 'admin' && (
                  <button
                    disabled
                    title="قريباً"
                    className="p-1.5 text-slate-300 dark:text-slate-600 rounded-md cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal with Permission Matrix */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xl space-y-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {editingEmp ? `تعديل صلاحيات الموظف (${editingEmp.name})` : 'إضافة موظف جديد وتعيين الصلاحيات'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {!editingEmp && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">اسم الموظف *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="محمد علي الشريف"
                      className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">البريد الإلكتروني *</label>
                    <input
                      type="email"
                      required
                      dir="ltr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="mohamed@toystore.com"
                      className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">كلمة المرور *</label>
                    <input
                      type="password"
                      name="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="8 أحرف على الأقل"
                      className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">الدور الوظيفي</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden"
                    >
                      <option value="employee">موظف (صلاحيات مخصصة)</option>
                      <option value="admin">مدير نظام كامل (Super Admin)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Matrix of permissions */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block font-bold text-slate-800 dark:text-slate-200">
                  مصفوفة الصلاحيات الممنوحة:
                </label>
                <PermissionMatrix
                  selectedPermissions={permissions}
                  onChange={setPermissions}
                  readOnly={role === 'admin'}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    resetForm();
                  }}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updatePermissionsMutation.isPending}
                  className="px-5 py-2 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-xs"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteId !== null}
        title="حذف حساب الموظف"
        description="هل أنت متأكد من حذف هذا الموظف؟ سيتم سحب كافة الصلاحيات وإلغاء إمكانية تسجيل الدخول فوراً."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
};

export default EmployeesPage;
