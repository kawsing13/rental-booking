import { createContext, useContext, useLayoutEffect, useState } from 'react';

const STORAGE_KEY = 'rb_theme';
const ThemeContext = createContext(null);

// Resolves the theme to apply on first render: an explicit choice saved
// from a previous visit wins; otherwise fall back to the OS preference so
// the app never "flashes" the wrong palette before JS finishes hydrating.
function getInitialTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  // Reflects the current theme onto <html data-theme="..."> - theme.css's
  // selectors key off that attribute, so this is the only DOM side effect
  // needed to make every component using the CSS variables repaint.
  // useLayoutEffect (not useEffect) so a toggle click paints synchronously
  // instead of flashing the old palette for a frame. The blocking inline
  // script in index.html handles the same job for the very first paint,
  // before React has even mounted.
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setTheme = (next) => {
    setThemeState(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
