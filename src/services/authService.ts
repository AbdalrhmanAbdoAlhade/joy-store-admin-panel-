import apiClient, { ApiResponse } from '@/src/lib/axios';
import { AdminUser, LoginPayload, LoginResponseData } from '@/src/types/auth';

const toArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  if (typeof value === 'string' && value) return [value];
  return [];
};

/**
 * Normalizes the many possible user shapes returned by the backend
 * ({ user }, { data: user }, roles/permissions nested or flat) into AdminUser.
 */
export const normalizeUser = (raw: any): AdminUser => {
  const source = raw?.data ?? raw?.user ?? raw ?? {};
  const roles = toArray(source.roles ?? source.role);
  const permissions = toArray(source.permissions);
  const isAdmin = roles.includes('admin') || permissions.includes('*');

  return {
    id: source.id,
    name: source.name ?? '',
    email: source.email ?? '',
    phone: source.phone ?? undefined,
    avatar: source.avatar ?? undefined,
    roles,
    permissions,
    role: isAdmin ? 'admin' : roles.includes('employee') ? 'employee' : 'user',
    created_at: source.created_at,
  };
};

export const authService = {
  async login(payload: LoginPayload): Promise<ApiResponse<LoginResponseData>> {
    const response = await apiClient.post<any>('/auth/login', {
      email: payload.email.trim(),
      password: payload.password,
      device_name: 'admin-panel',
    });

    const res = response.data;
    const token = res?.token || res?.data?.token;
    const rawUser = res?.user || res?.data?.user;

    if (!token || !rawUser) {
      throw new Error(res?.message || 'استجابة تسجيل الدخول غير صالحة');
    }

    return {
      success: true,
      message: res?.message || 'تم تسجيل الدخول بنجاح',
      data: {
        token,
        token_type: res?.token_type || 'Bearer',
        user: normalizeUser(rawUser),
      },
    };
  },

  async getProfile(token?: string): Promise<AdminUser> {
    const response = await apiClient.get<any>(
      '/auth/me',
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    );
    return normalizeUser(response.data);
  },

  async logout(): Promise<ApiResponse<null>> {
    try {
      const response = await apiClient.post<ApiResponse<null>>('/auth/logout');
      return response.data;
    } catch {
      // Logout is best-effort: the local session is cleared regardless.
      return { success: true, message: 'تم تسجيل الخروج بنجاح', data: null };
    }
  },
};

export default authService;
