import { useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

const THEME_KEY = 'tabula_theme_preference_v2';

export function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') {
      const root = document.documentElement;
      if (saved === 'light') {
        root.classList.add('light-mode');
        root.classList.remove('dark-mode');
      } else {
        root.classList.add('dark-mode');
        root.classList.remove('light-mode');
      }
      return saved;
    }
  } catch (e) {
    // fallback
  }
  return 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme());

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-mode');
      root.classList.remove('dark-mode');
    } else {
      root.classList.add('dark-mode');
      root.classList.remove('light-mode');
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return { theme, setTheme, toggleTheme };
}
