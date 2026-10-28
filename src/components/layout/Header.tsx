import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Globe,
  LogOut,
  User,
  Shield,
  ChevronDown,
} from 'lucide-react';
import { JoyLogo } from '@/src/components/common/JoyLogo';
import { useAuthStore } from '@/src/stores/authStore';
import { useThemeStore } from '@/src/stores/themeStore';
import { resolveMediaUrl } from '@/src/services/profileService';
import { setAppLanguage } from '@/src/i18n';

export const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const unreadNotifications = 0;
  const avatarUrl = resolveMediaUrl(user?.avatar);
  const roleLabel =
    user?.roles?.includes('admin')
      ? 'مدير عام'
      : user?.roles?.includes('employee')
        ? 'موظف'
        : user?.role === 'admin'
          ? 'مدير عام'
          : user?.role === 'employee'
            ? 'موظف'
            : user?.role || 'مستخدم';

  const toggleLang = () => {
    const nextLang = i18n.language === 'ar' ? 'en' : 'ar';
    setAppLanguage(nextLang);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
  };

  // Build clean breadcrumbs based on pathname
  const pathSegments = location.pathname.split('/').filter(Boolean);

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Left: Breadcrumbs or Search */}
      <div className="flex items-center gap-4 flex-1 max-w-lg">
        <Link to="/dashboard" className="md:hidden shrink-0">
          <JoyLogo size="sm" showSlogan={false} />
        </Link>

        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xs md:max-w-sm">
          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common.search')}
            className="w-full ps-9 pe-4 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 outline-hidden placeholder:text-slate-400"
          />
        </form>

        {/* Breadcrumb path hint */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400">
          <span className="hover:text-slate-600 dark:hover:text-slate-300">JOY</span>
          {pathSegments.map((segment, idx) => (
            <React.Fragment key={idx}>
              <span>/</span>
              <span className="capitalize text-slate-600 dark:text-slate-300">
                {segment}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Language Switch */}
        <button
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="تبديل اللغة / Switch Language"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{i18n.language === 'ar' ? 'English' : 'عربي'}</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title={isDark ? t('common.light') : t('common.dark')}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications Icon */}
        <button
          onClick={() => navigate('/notifications')}
          className="p-2 relative text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title={t('nav.notifications')}
        >
          <Bell className="w-4 h-4" />
          {unreadNotifications > 0 && (
            <span className="absolute -top-0.5 -end-0.5 min-w-4 h-4 px-1 flex items-center justify-center text-[9px] font-bold text-white bg-red-500 rounded-full">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
        </button>

        {/* Admin Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 ps-2 pe-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt={user?.name || 'avatar'} className="w-full h-full object-cover" />
              ) : (
                user?.name ? user.name.charAt(0).toUpperCase() : 'A'
              )}
            </div>
            <div className="hidden sm:flex flex-col text-start">
              <span className="text-xs font-semibold leading-tight text-slate-900 dark:text-white">
                {user?.name || 'Admin'}
              </span>
              <div className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                <Shield className="w-2.5 h-2.5" />
                <span className="capitalize">{roleLabel}</span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {profileOpen && (
            <div
              className="absolute end-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
              onMouseLeave={() => setProfileOpen(false)}
            >
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {user?.name}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(user?.roles?.length ? user.roles : [user?.role || 'admin']).map((r) => (
                    <span
                      key={r}
                      className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 capitalize"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setProfileOpen(false);
                  navigate('/profile');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-start"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{t('common.profile')}</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-start border-t border-slate-100 dark:border-slate-800"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('common.logout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
