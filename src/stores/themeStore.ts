import { create } from 'zustand';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const getInitialTheme = (): ThemeMode => {
  const saved = localStorage.getItem('toy_admin_theme') as ThemeMode;
  if (saved && ['light', 'dark', 'system'].includes(saved)) {
    return saved;
  }
  return 'light';
};

const applyThemeToDOM = (theme: ThemeMode): boolean => {
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  return isDark;
};

export const useThemeStore = create<ThemeState>((set, get) => {
  const initialTheme = getInitialTheme();
  const initialIsDark = applyThemeToDOM(initialTheme);

  return {
    theme: initialTheme,
    isDark: initialIsDark,
    setTheme: (theme: ThemeMode) => {
      localStorage.setItem('toy_admin_theme', theme);
      const isDark = applyThemeToDOM(theme);
      set({ theme, isDark });
    },
    toggleTheme: () => {
      const current = get().theme;
      const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
      get().setTheme(next);
    },
  };
});
