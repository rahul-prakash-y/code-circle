import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark';

  const stored = localStorage.getItem('code-circle-theme') as Theme | null;
  if (stored === 'light' || stored === 'dark') return stored;

  // Respect OS preference
  if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
};

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  localStorage.setItem('code-circle-theme', theme);
};

const useThemeStore = create<ThemeStore>((set) => {
  // Apply initial theme immediately
  const initial = getInitialTheme();
  if (typeof window !== 'undefined') {
    applyTheme(initial);
  }

  return {
    theme: initial,

    setTheme: (theme) => {
      applyTheme(theme);
      set({ theme });
    },

    toggleTheme: () => {
      set((state) => {
        const next = state.theme === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        return { theme: next };
      });
    },
  };
});

export default useThemeStore;
