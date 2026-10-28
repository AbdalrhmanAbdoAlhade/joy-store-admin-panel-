import { useAuthStore } from '@/src/stores/authStore';
import type { AdminUser } from '@/src/types/auth';

export const checkPermission = (
  user: AdminUser | null,
  permission?: string | null
): boolean => {
  if (!permission) return true;
  if (!user) return false;
  if (user.roles?.includes('admin')) return true;
  if (user.permissions?.includes('*')) return true;
  return user.permissions?.includes(permission) ?? false;
};

export function usePermission(permission?: string | null): boolean {
  const user = useAuthStore((s) => s.user);
  return checkPermission(user, permission);
}

export default usePermission;
