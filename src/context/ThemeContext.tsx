import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeType = 'PURPLE' | 'CYAN' | 'EMERALD';

interface ThemeContextValue {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  cycleTheme: () => void;
  accentColor: string;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    return (localStorage.getItem('pioneer_theme') as ThemeType) || 'PURPLE';
  });

  const setTheme = (t: ThemeType) => {
    setThemeState(t);
    localStorage.setItem('pioneer_theme', t);
  };

  const cycleTheme = () => {
    const list: ThemeType[] = ['PURPLE', 'CYAN', 'EMERALD'];
    const next = list[(list.indexOf(theme) + 1) % list.length];
    setTheme(next);
  };

  const accentColor =
    theme === 'CYAN'
      ? '#06b6d4'
      : theme === 'EMERALD'
      ? '#10b981'
      : '#9333ea';

  useEffect(() => {
    document.documentElement.dataset.theme = theme.toLowerCase();
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme, accentColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
};
