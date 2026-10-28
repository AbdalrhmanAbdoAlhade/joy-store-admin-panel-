export interface Permission {
  id: number | string;
  name: string;
  group?: string;
  description?: string;
}

export interface Role {
  id: number | string;
  name: string;
  guard_name?: string;
  permissions?: string[];
  users_count?: number;
}
