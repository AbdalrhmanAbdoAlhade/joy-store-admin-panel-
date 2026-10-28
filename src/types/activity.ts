export interface ActivityLog {
  id: number | string;
  user_id?: number | string;
  user_name: string;
  user_role: string;
  action_type: 'create' | 'update' | 'delete' | 'status_change' | 'refund' | 'login' | 'export';
  subject_type: 'product' | 'order' | 'inventory' | 'coupon' | 'customer' | 'employee' | 'settings';
  subject_id?: string | number;
  description: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}
