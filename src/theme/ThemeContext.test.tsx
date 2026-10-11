import React from 'react';
import { ThemeProvider, useTheme } from './ThemeContext';
import { lightTheme, darkTheme } from './colors';
import { render, cleanup, act } from '../../tests/support/renderer';
afterEach(cleanup);
it('THM-001 changes tokens with the selected theme', async () => {
  let tokens = lightTheme;
  function Probe() { tokens = useTheme(); return null; }
  const tree = await render(<ThemeProvider mode="light"><Probe /></ThemeProvider>); expect(tokens).toBe(lightTheme);
  await act(async () => tree.update(<ThemeProvider mode="dark"><Probe /></ThemeProvider>)); expect(tokens).toBe(darkTheme);
});
