import React, { createContext, useContext, useEffect } from 'react';
import useThemeStore from '../store/useThemeStore';

type Theme = 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme?: any) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const defaultContext: ThemeContextType = {
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
  isDark: true,
};

const ThemeContext = createContext<ThemeContextType>(defaultContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
    try {
      localStorage.setItem('code-circle-theme', 'dark');
    } catch {}
  }, []);

  return (
    <ThemeContext.Provider value={defaultContext}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  return context || defaultContext;
};

export default ThemeContext;
