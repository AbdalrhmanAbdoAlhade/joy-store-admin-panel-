import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import {
  ShieldAlert,
  Lock,
  Mail,
  ArrowRight,
  Globe,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/src/stores/authStore';
import { useThemeStore } from '@/src/stores/themeStore';
import { authService } from '@/src/services/authService';
import { JoyLogo } from '@/src/components/common/JoyLogo';
import { setAppLanguage } from '@/src/i18n';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('يرجى إدخال بريد إلكتروني صحيح'),
  password: z.string().min(6, 'كلمة المرور يجب ألا تقل عن 6 أحرف'),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const isExpired = searchParams.get('expired') === '1';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: true,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const response = await authService.login(values);
      const token = response.data.token;

      // Ask the backend for the authoritative roles/permissions (login user has neither)
      const profile = await authService.getProfile(token);
      const hasPanelAccess =
        profile.role === 'admin' ||
        profile.roles?.includes('admin') ||
        profile.roles?.includes('employee') ||
        (profile.permissions?.length ?? 0) > 0;

      if (!hasPanelAccess) {
        setAuthError(t('common.unauthorized'));
        toast.error(t('common.unauthorized'));
        return;
      }

      login(token, profile);
      toast.success(`مرحباً بك مجدداً، ${profile.name}`);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const message = err?.response?.data?.message || t('auth.invalidCredentials');
      setAuthError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemoAdmin = () => {
    setValue('email', 'admin@toys-store.com');
    setValue('password', 'password');
    setAuthError(null);
  };

  const handleFillDemoUserFail = () => {
    setValue('email', 'customer@example.com');
    setValue('password', 'password');
    setAuthError(null);
  };

  const toggleLang = () => {
    const next = i18n.language === 'ar' ? 'en' : 'ar';
    setAppLanguage(next);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between p-4 md:p-8 antialiased">
      {/* Top controls: Lang & Theme */}
      <div className="flex items-center justify-between max-w-5xl w-full mx-auto">
        <JoyLogo size="sm" showSlogan={false} />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLang}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-800"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{i18n.language === 'ar' ? 'English' : 'عربي'}</span>
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-800"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md mx-auto my-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <JoyLogo size="lg" showSlogan={true} />
            <h2 className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              لوحة الإدارة
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              بوابة المديرين والموظفين
            </p>
          </div>

          {/* Admin Role Notice */}
          <div className="mb-5 p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
            <p className="leading-relaxed text-[11px]">{t('auth.adminOnlyNotice')}</p>
          </div>

          {isExpired && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300">
              انتهت صلاحية جلستك السابقة، يرجى إعادة تسجيل الدخول لمواصلة إدارة المتجر.
            </div>
          )}

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-800 dark:text-red-300">
              {authError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  {...register('email')}
                  placeholder="admin@toystore.com"
                  dir="ltr"
                  className="w-full ps-9 pe-4 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  {...register('password')}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full ps-9 pe-4 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                />
              </div>
              {errors.password && (
                <p className="text-[11px] text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  {...register('remember')}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span>{t('auth.rememberMe')}</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t('auth.loggingIn')}</span>
                </>
              ) : (
                <>
                  <span>{t('auth.loginButton')}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center space-y-2">
            <p className="text-[11px] text-slate-400 font-medium">تجربة سريعة للحسابات:</p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleFillDemoAdmin}
                className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                <span>حساب أدمن النظام (مقبول)</span>
              </button>
              <button
                type="button"
                onClick={handleFillDemoUserFail}
                className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors"
                title="لاختبار الحظر التلقائي لغير الأدمن"
              >
                <span>حساب مستخدم (مرفوض)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400">
        JOY - إلعب وتعلم · © 2026
      </div>
    </div>
  );
};

export default LoginPage;
