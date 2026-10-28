import apiClient, { ApiResponse } from '@/src/lib/axios';
import { Role, Permission } from '@/src/types/role';
import { ensureArray, unwrapEnvelope } from '@/src/lib/api-helpers';

function normalizeRole(r: any): Role {
  return {
    id: r?.id ?? '',
    name: r?.name ?? '',
    guard_name: r?.guard_name,
    users_count: r?.users_count ?? r?.users?.length ?? undefined,
    permissions: ensureArray<any>(r?.permissions)
      .map((p) => (typeof p === 'string' ? p : p?.name))
      .filter(Boolean),
  };
}

function normalizePermission(p: any): Permission {
  const name = p?.name ?? '';
  return {
    id: p?.id ?? name,
    name,
    group: p?.group ?? (name.includes('.') ? name.split('.')[0] : 'general'),
    description: p?.description,
  };
}

export const roleService = {
  async getRoles(): Promise<ApiResponse<Role[]>> {
    const response = await apiClient.get<any>('/admin/roles');
    const rows = ensureArray(unwrapEnvelope(response));
    return { success: true, data: rows.map(normalizeRole) };
  },

  async getPermissions(): Promise<ApiResponse<Permission[]>> {
    const response = await apiClient.get<any>('/admin/permissions');
    const rows = ensureArray(unwrapEnvelope(response));
    return { success: true, data: rows.map(normalizePermission) };
  },

  // NOTE: backend validation requires a non-empty permissions array
  // (`permissions: []` returns 422). Callers must guard against an empty selection.
  async updateRolePermissions(
    roleId: number | string,
    permissions: string[]
  ): Promise<ApiResponse<Role>> {
    const response = await apiClient.put<any>(`/admin/roles/${roleId}/permissions`, { permissions });
    const res = response.data;
    return {
      success: true,
      message: res?.message || 'تم تحديث صلاحيات الدور',
      data: normalizeRole(res?.role || res?.data || {}),
    };
  },
};

export default roleService;
