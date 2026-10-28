export interface AdminUser {
  id: number | string;
  name: string;
  email: string;
  role: 'admin' | 'employee' | 'user';
  roles?: string[];
  avatar?: string | null;
  phone?: string | null;
  email_verified_at?: string | null;
  phone_verified_at?: string | null;
  permissions?: string[];
  created_at?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  remember?: boolean;
}

export interface LoginResponseData {
  token: string;
  token_type: string;
  user: AdminUser;
}
