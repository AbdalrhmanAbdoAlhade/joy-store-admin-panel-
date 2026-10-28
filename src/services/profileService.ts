import { apiClient, BASE_API_URL } from '@/src/lib/axios';
import { unwrapEnvelope } from '@/src/lib/api-helpers';
import type { ProfileUser } from '@/src/types/profile';

const MEDIA_BASE = BASE_API_URL.replace(/\/api\/v\d+\/?$/, '');

function normalizeProfile(raw: any): ProfileUser {
  return {
    id: raw?.id,
    name: raw?.name ?? '',
    email: raw?.email ?? '',
    phone: raw?.phone ?? null,
    avatar: raw?.avatar ?? null,
    email_verified_at: raw?.email_verified_at ?? null,
    phone_verified_at: raw?.phone_verified_at ?? null,
    roles: Array.isArray(raw?.roles) ? raw.roles : [],
    permissions: Array.isArray(raw?.permissions) ? raw.permissions : [],
    status: raw?.status,
    created_at: raw?.created_at,
  };
}

export function resolveMediaUrl(path?: string | null): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${MEDIA_BASE}/storage/${path.replace(/^\//, '')}`;
}

export const profileService = {
  getProfile: async (): Promise<ProfileUser> => {
    const res = await apiClient.get('/auth/me');
    return normalizeProfile(unwrapEnvelope(res));
  },

  updateProfile: async (data: { name?: string; email?: string; phone?: string; avatar?: File | null }) => {
    const fd = new FormData();
    if (data.name) fd.append('name', data.name);
    if (data.email) fd.append('email', data.email);
    if (data.phone) fd.append('phone', data.phone);
    if (data.avatar instanceof File) fd.append('avatar', data.avatar);

    const res = await apiClient.post('/profile', fd);
    const raw = res.data?.user ?? res.data?.data?.user ?? unwrapEnvelope(res);
    return normalizeProfile(raw);
  },

  changePassword: async (data: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) => {
    const res = await apiClient.put('/profile/password', data);
    return res.data;
  },
};

export default profileService;
