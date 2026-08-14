import React, { createContext, useContext } from 'react';
import { ThemeTokens, lightTheme, darkTheme } from './colors';

const ThemeContext = createContext<ThemeTokens>(lightTheme);

export function ThemeProvider({
  mode,
  children,
}: {
  mode: 'light' | 'dark';
  children: React.ReactNode;
}) {
  const tokens = mode === 'dark' ? darkTheme : lightTheme;
  return <ThemeContext.Provider value={tokens}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeTokens {
  return useContext(ThemeContext);
}
