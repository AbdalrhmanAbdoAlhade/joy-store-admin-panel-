export interface ProfileUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  email_verified_at?: string | null;
  phone_verified_at?: string | null;
  roles?: string[];
  permissions?: string[];
  status?: string;
  created_at?: string;
}
