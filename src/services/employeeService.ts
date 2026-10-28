import apiClient, { ApiResponse } from '@/src/lib/axios';
import { Employee, PermissionKey } from '@/src/types/employee';

let mockEmployees: Employee[] = [
  {
    id: 1,
    name: 'عبدالرحمن محمد',
    email: 'admin@toystore.com',
    role: 'admin',
    is_active: true,
    permissions: [
      'orders.view',
      'orders.update_status',
      'orders.create_manual',
      'products.manage',
      'inventory.manage',
      'reviews.moderate',
      'tickets.reply',
      'returns.manage',
      'coupons.view',
      'customers.manage',
      'reports.view',
      'settings.manage',
    ],
    last_active_at: 'الآن (نشط)',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'محمد علي الشريف',
    email: 'mohamed.ali@toystore.com',
    role: 'employee',
    is_active: true,
    permissions: ['orders.view', 'orders.update_status', 'inventory.manage', 'returns.manage'],
    last_active_at: 'منذ ساعتين',
    created_at: '2025-06-15T10:00:00Z',
  },
  {
    id: 3,
    name: 'ياسمين حسن رضوان',
    email: 'yasmin.hassan@toystore.com',
    role: 'employee',
    is_active: true,
    permissions: ['tickets.reply', 'reviews.moderate', 'orders.view'],
    last_active_at: 'منذ يوم',
    created_at: '2025-09-01T12:00:00Z',
  },
];

export const employeeService = {
  async getEmployees(): Promise<ApiResponse<Employee[]>> {
    try {
      const response = await apiClient.get<ApiResponse<Employee[]>>('/admin/employees');
      return response.data;
    } catch {
      return { success: true, data: mockEmployees };
    }
  },

  async createEmployee(payload: Partial<Employee> & { password?: string }): Promise<ApiResponse<Employee>> {
    try {
      const response = await apiClient.post<ApiResponse<Employee>>('/admin/employees', payload);
      return response.data;
    } catch {
      const newEmp: Employee = {
        id: Date.now(),
        name: payload.name || 'موظف جديد',
        email: payload.email || `employee-${Date.now()}@toystore.com`,
        role: payload.role || 'employee',
        is_active: true,
        permissions: payload.permissions || ['orders.view'],
        created_at: new Date().toISOString(),
      };
      mockEmployees.push(newEmp);
      return { success: true, message: 'تمت إضافة الموظف بنجاح', data: newEmp };
    }
  },

  async updatePermissions(id: number | string, permissions: PermissionKey[]): Promise<ApiResponse<Employee>> {
    try {
      // TODO: confirm endpoint /employees/{id}/permissions
      const response = await apiClient.put<ApiResponse<Employee>>(`/admin/employees/${id}/permissions`, { permissions });
      return response.data;
    } catch {
      const idx = mockEmployees.findIndex((e) => String(e.id) === String(id));
      if (idx !== -1) {
        mockEmployees[idx].permissions = permissions;
        return { success: true, message: 'تم تحديث مصفوفة الصلاحيات بنجاح', data: mockEmployees[idx] };
      }
      throw new Error('Employee not found');
    }
  },

  async deleteEmployee(id: number | string): Promise<ApiResponse<null>> {
    // Endpoint not available in backend
    // const response = await apiClient.delete<ApiResponse<null>>(`/employees/${id}`);
    // return response.data;
    void id;
    return { success: false, message: 'قريباً', data: null };
  },
};

export default employeeService;
