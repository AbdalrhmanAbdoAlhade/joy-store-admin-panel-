import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '@/src/stores/authStore';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    from?: number;
    to?: number;
  };
  errors?: Record<string, string[]>;
}

export const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

// Request Interceptor: Attach Bearer Token & Accept-Language
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('toy_admin_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const currentLang = localStorage.getItem('toy_admin_lang') || 'ar';
    if (config.headers) {
      config.headers['Accept-Language'] = currentLang;
    }

    // For FormData payloads, remove the JSON Content-Type so the browser/axios
    // sets `multipart/form-data; boundary=...` automatically.
    if (typeof FormData !== 'undefined' && config.data instanceof FormData && config.headers) {
      (config.headers as any).delete?.('Content-Type');
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Unified Error Handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
    if (!error.response) {
      toast.error('تعذر الاتصال بالخادم. يرجى التحقق من اتصال الشبكة.');
      return Promise.reject(error);
    }

    const { status, data } = error.response;
    const isAr = (localStorage.getItem('toy_admin_lang') || 'ar') === 'ar';

    switch (status) {
      case 401:
        // Session is no longer valid: reset the auth store (not just localStorage)
        // so no stale user/token remains in memory, then redirect once.
        {
          const wasAuthenticated = useAuthStore.getState().isAuthenticated;
          useAuthStore.getState().logout();
          if (wasAuthenticated) {
            toast.error(
              isAr ? 'انتهت جلستك، يرجى تسجيل الدخول مجددًا' : 'Session expired, please log in again'
            );
          }
          if (window.location.pathname !== '/login') {
            window.location.replace('/login?expired=1');
          }
        }
        break;

      case 403:
        toast.error(
          data?.message ||
          (isAr
            ? 'غير مصرح لك بتنفيذ هذه العملية أو الوصول إلى هذا المورد'
            : 'You are not authorized to perform this operation')
        );
        break;

      case 422:
        if (data?.errors) {
          const firstError = Object.values(data.errors)[0]?.[0];
          toast.error(firstError || (isAr ? 'بيانات غير صالحة، يرجى مراجعة الحقول' : 'Validation failed'));
        } else {
          toast.error(data?.message || (isAr ? 'بيانات غير صالحة' : 'Invalid data submitted'));
        }
        break;

      case 429:
        toast.error(
          isAr
            ? 'تم تجاوز الحد الأقصى للطلبات، يرجى الانتظار قليلاً والمحاولة مجدداً'
            : 'Too many requests. Please slow down and try again.'
        );
        break;

      case 500:
      default:
        toast.error(
          data?.message || (isAr ? 'حدث خطأ في الخادم (500)، يرجى المحاولة لاحقاً' : 'Server error occurred')
        );
        break;
    }

    return Promise.reject(error);
  }
);

export default apiClient;
