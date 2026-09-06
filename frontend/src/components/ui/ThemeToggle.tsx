import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import useThemeStore from '../../store/useThemeStore';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className={`relative p-2.5 rounded-xl transition-all duration-300 
        bg-surface-elevated border border-border hover:border-border-hover 
        hover:scale-[1.05] active:scale-[0.95] group ${className}`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'dark' ? 0 : 180 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {theme === 'dark' ? (
          <Moon size={18} className="text-violet-400 group-hover:text-violet-300 transition-colors" />
        ) : (
          <Sun size={18} className="text-amber-500 group-hover:text-amber-400 transition-colors" />
        )}
      </motion.div>
    </button>
  );
};

export default ThemeToggle;
