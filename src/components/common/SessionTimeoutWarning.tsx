import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/src/stores/authStore';
import { ShieldAlert, Clock, RefreshCw, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const COUNTDOWN_SECONDS = 60; // 1 minute warning countdown

export const SessionTimeoutWarning: React.FC = () => {
  const { isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const isAr = (localStorage.getItem('toy_admin_lang') || 'ar') === 'ar';

  const lastActivityRef = useRef<number>(Date.now());
  const checkIntervalRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);

  // Reset activity timestamp on user interaction
  const resetActivity = () => {
    lastActivityRef.current = Date.now();
    if (showWarning) {
      setShowWarning(false);
      setCountdown(COUNTDOWN_SECONDS);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleUserActivity = () => {
      // If warning is not visible, record activity
      if (!showWarning) {
        lastActivityRef.current = Date.now();
      }
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);

    // Periodic check for inactivity
    checkIntervalRef.current = setInterval(() => {
      const inactiveDuration = Date.now() - lastActivityRef.current;
      if (inactiveDuration >= INACTIVITY_TIMEOUT_MS && !showWarning) {
        setShowWarning(true);
        setCountdown(COUNTDOWN_SECONDS);
      }
    }, 10000);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isAuthenticated, showWarning]);

  // Countdown timer when warning is shown
  useEffect(() => {
    if (showWarning) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            handleForceLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [showWarning]);

  const handleForceLogout = () => {
    setShowWarning(false);
    logout();
    navigate('/login?expired=1');
  };

  if (!showWarning || !isAuthenticated) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {isAr ? 'تنبيه: اقتراب انتهاء الجلسة' : 'Session Timeout Warning'}
            </h3>
            <p className="text-xs text-slate-500">
              {isAr ? 'لم يتم رصد أي نشاط منذ فترة' : 'No activity detected for a while'}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {isAr
            ? `لحماية أمان بيانات متجر الألعاب، سيتم تسجيل خروجك تلقائياً خلال ${countdown} ثانية ما لم تقم بتمديد الجلسة.`
            : `To protect toy store security, you will be automatically logged out in ${countdown} seconds unless you extend your session.`}
        </p>

        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-amber-500 h-full transition-all duration-1000"
            style={{ width: `${(countdown / COUNTDOWN_SECONDS) * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleForceLogout}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isAr ? 'تسجيل الخروج الآن' : 'Log out now'}</span>
          </button>
          <button
            type="button"
            onClick={resetActivity}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isAr ? 'تمديد الجلسة' : 'Extend Session'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutWarning;
