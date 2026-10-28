import { create } from 'zustand';
import { AdminUser } from '@/src/types/auth';

export type { AdminUser };

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: AdminUser) => void;
  logout: () => void;
  updateUser: (partial: Partial<AdminUser>) => void;
  hasPermission: (permission: string) => boolean;
}

const USER_KEY = 'toy_admin_user';
const TOKEN_KEY = 'toy_admin_token';
const LOGGED_OUT_KEY = 'toy_admin_logged_out';

const readUser = (): AdminUser | null => {
  try {
    if (localStorage.getItem(LOGGED_OUT_KEY) === 'true') {
      return null;
    }
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
};

const readToken = (): string | null => {
  if (localStorage.getItem(LOGGED_OUT_KEY) === 'true') {
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
};

const initialUser = readUser();
const initialToken = readToken();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialUser,
  token: initialToken,
  isAuthenticated: !!initialUser && !!initialToken,
  isLoading: false,

  login: (token: string, user: AdminUser) => {
    localStorage.removeItem(LOGGED_OUT_KEY);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    set({
      token,
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: () => {
    localStorage.setItem(LOGGED_OUT_KEY, 'true');
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  updateUser: (partial: Partial<AdminUser>) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...partial };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    set({ user: updated });
  },

  hasPermission: (permission: string) => {
    const user = get().user;
    if (!user) return false;
    if (user.role === 'admin' || user.roles?.includes('admin')) return true;
    if (user.permissions?.includes('*')) return true;
    return user.permissions?.includes(permission) || false;
  },
}));
