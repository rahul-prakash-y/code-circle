import { create } from 'zustand';

type Theme = 'dark';

interface ThemeStore {
  theme: Theme;
  setTheme: (theme?: any) => void;
  toggleTheme: () => void;
}

const applyDarkTheme = () => {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  }
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('code-circle-theme', 'dark');
    } catch {}
  }
};

const useThemeStore = create<ThemeStore>(() => {
  if (typeof window !== 'undefined') {
    applyDarkTheme();
  }

  return {
    theme: 'dark',
    setTheme: () => {
      applyDarkTheme();
    },
    toggleTheme: () => {
      applyDarkTheme();
    },
  };
});

export default useThemeStore;
