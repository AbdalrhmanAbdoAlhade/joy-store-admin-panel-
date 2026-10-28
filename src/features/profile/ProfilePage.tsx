import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, KeyRound, Mail, Phone, User as UserIcon, RefreshCw } from 'lucide-react';
import { profileService, resolveMediaUrl } from '@/src/services/profileService';
import { useAuthStore } from '@/src/stores/authStore';
import type { ProductImage } from '@/src/types/product';
import ImageUploader from '@/src/components/forms/ImageUploader';
import { formatDate } from '@/src/lib/utils';
import { toast } from 'sonner';

export const ProfilePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { updateUser } = useAuthStore();
  const isAr = (localStorage.getItem('toy_admin_lang') || 'ar') === 'ar';

  const { data: profile, isLoading, isError, refetch } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => profileService.getProfile(),
  });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarImages, setAvatarImages] = useState<ProductImage[]>([]);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!profile) return;
    setName(profile.name || '');
    setEmail(profile.email || '');
    setPhone(profile.phone || '');
    setAvatarImages(
      profile.avatar
        ? [{ id: 'current-avatar', url: resolveMediaUrl(profile.avatar), order: 0, is_primary: true }]
        : []
    );
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: () =>
      profileService.updateProfile({
        name,
        email,
        phone,
        avatar: avatarImages[0]?.file ?? null,
      }),
    onSuccess: (updated) => {
      toast.success(isAr ? 'تم تحديث البيانات بنجاح' : 'Profile updated successfully');
      updateUser({
        name: updated?.name ?? name,
        email: updated?.email ?? email,
        phone: updated?.phone ?? phone,
        avatar: updated?.avatar ?? undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: () =>
      profileService.changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      }),
    onSuccess: () => {
      toast.success(isAr ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error(isAr ? 'الاسم والبريد الإلكتروني مطلوبان' : 'Name and email are required');
      return;
    }
    updateMutation.mutate();
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(isAr ? 'جميع حقول كلمة المرور مطلوبة' : 'All password fields are required');
      return;
    }
    if (newPassword.length < 8) {
      toast.error(isAr ? 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل' : 'New password must be at least 8 characters');
      return;
    }
    if (newPassword === currentPassword) {
      toast.error(isAr ? 'كلمة المرور الجديدة يجب أن تختلف عن الحالية' : 'New password must differ from the current one');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }
    passwordMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <span className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <p className="font-semibold text-slate-700 dark:text-slate-300">
          {isAr ? 'تعذر تحميل الملف الشخصي' : 'Failed to load profile'}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
        >
          {isAr ? 'إعادة المحاولة' : 'Retry'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {isAr ? 'الملف الشخصي' : 'My Profile'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isAr
            ? 'إدارة بيانات حسابك الشخصية وكلمة المرور'
            : 'Manage your account details and password'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Account info */}
        <form
          onSubmit={handleProfileSubmit}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4"
        >
          <h2 className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100 pb-3 border-b border-slate-100 dark:border-slate-800">
            <UserIcon className="w-4 h-4 text-blue-600" />
            {isAr ? 'معلومات الحساب' : 'Account Information'}
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {isAr ? 'الصورة الشخصية' : 'Avatar'}
            </label>
            <ImageUploader images={avatarImages} onChange={setAvatarImages} maxFiles={1} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {isAr ? 'الاسم' : 'Name'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {isAr ? 'البريد الإلكتروني' : 'Email'} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full ps-9 pe-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {isAr ? 'الهاتف' : 'Phone'}
            </label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full ps-9 pe-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                {isAr ? 'الأدوار' : 'Roles'}
              </p>
              <div className="flex flex-wrap gap-1">
                {profile.roles?.length ? (
                  profile.roles.map((role) => (
                    <span
                      key={role}
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                    >
                      {role}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-400">—</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                {isAr ? 'عدد الصلاحيات' : 'Permissions'}
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                {profile.permissions?.length ?? 0}
              </span>
            </div>
          </div>

          {profile.created_at && (
            <p className="text-[11px] text-slate-400">
              {isAr ? 'تاريخ الانضمام' : 'Member since'}: {formatDate(profile.created_at)}
            </p>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-60"
            >
              {updateMutation.isPending ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              {isAr ? 'حفظ التعديلات' : 'Save changes'}
            </button>
          </div>
        </form>

        {/* Change password */}
        <form
          onSubmit={handlePasswordSubmit}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4"
        >
          <h2 className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100 pb-3 border-b border-slate-100 dark:border-slate-800 w-full">
            <KeyRound className="w-4 h-4 text-blue-600" />
            {isAr ? 'تغيير كلمة المرور' : 'Change Password'}
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {isAr ? 'كلمة المرور الحالية' : 'Current password'} <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {isAr ? 'كلمة المرور الجديدة' : 'New password'} <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              {isAr ? '8 أحرف على الأقل' : 'At least 8 characters'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {isAr ? 'تأكيد كلمة المرور' : 'Confirm new password'} <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={passwordMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 rounded-lg disabled:opacity-60"
            >
              {passwordMutation.isPending ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <KeyRound className="w-3.5 h-3.5" />
              )}
              {isAr ? 'تغيير كلمة المرور' : 'Change password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
