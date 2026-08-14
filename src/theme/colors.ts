// Ported from the prototype's :root / [data-theme="dark"] CSS custom properties.

export interface GradientSpec {
  colors: string[];
  locations?: number[];
}

export interface ThemeTokens {
  mode: 'light' | 'dark';
  bg: string;
  card: string;
  sheet: string;
  text: string;
  textMuted: string;
  textFaint: string;
  border: string;
  divider: string;
  borderStrong: string;
  borderStrong2: string;
  success: string;
  danger: string;
  warning: string;
  orange: string;
  accent: string;
  accentLight: string;
  inputBg: string;
  overlay: string;
  gradientAccent: GradientSpec;
  gradientHero: GradientSpec;
  gradientPortfolio: GradientSpec;
  gradientPayouts: GradientSpec;
  gradientCalc: GradientSpec;
  gradientNotif: GradientSpec;
  // rgba tint helpers reused across cards/icons (same alpha family as the prototype's inline rgba() usages)
  tint: (hex: string, alpha: number) => string;
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export const lightTheme: ThemeTokens = {
  mode: 'light',
  bg: '#f5f3fb',
  card: '#ffffff',
  sheet: '#ffffff',
  text: '#1e2135',
  textMuted: '#5b6178',
  textFaint: '#9297ad',
  border: 'rgba(30,32,66,0.07)',
  divider: 'rgba(30,32,66,0.05)',
  borderStrong: 'rgba(30,32,66,0.14)',
  borderStrong2: 'rgba(30,32,66,0.22)',
  success: '#0ea472',
  danger: '#e2495a',
  warning: '#c9861a',
  orange: '#e2793f',
  accent: '#6f66e8',
  accentLight: '#9a90f5',
  inputBg: '#f6f4fc',
  overlay: 'rgba(30,20,60,0.4)',
  gradientAccent: { colors: ['#8b7ef0', '#6f66e8'] },
  gradientHero: { colors: ['#e7e2fb', '#dbe7fd', '#dcf5ec'], locations: [0, 0.55, 1] },
  gradientPortfolio: { colors: ['#eee9fc', '#e3edfb'] },
  gradientPayouts: { colors: ['#e3edfb', '#e0f6ee'] },
  gradientCalc: { colors: ['#ece6fb', '#e1f6f5'] },
  gradientNotif: { colors: ['#fbeae5', '#ece6fb'] },
  tint: hexToRgba,
};

export const darkTheme: ThemeTokens = {
  mode: 'dark',
  bg: '#131024',
  card: '#1d1935',
  sheet: '#251f3f',
  text: '#f1eefc',
  textMuted: '#a9a3c9',
  textFaint: '#79749e',
  border: 'rgba(255,255,255,0.08)',
  divider: 'rgba(255,255,255,0.06)',
  borderStrong: 'rgba(255,255,255,0.14)',
  borderStrong2: 'rgba(255,255,255,0.22)',
  success: '#4ade91',
  danger: '#ff6b7d',
  warning: '#fbbf5c',
  orange: '#ff9a5c',
  accent: '#9086f5',
  accentLight: '#b3aafa',
  inputBg: '#251f3f',
  overlay: 'rgba(5,5,15,0.6)',
  gradientAccent: { colors: ['#9086f5', '#7a6ef0'] },
  gradientHero: { colors: ['#2c2752', '#252049', '#1c3a3a'], locations: [0, 0.55, 1] },
  gradientPortfolio: { colors: ['#2b2650', '#20264a'] },
  gradientPayouts: { colors: ['#20264a', '#1c3a3a'] },
  gradientCalc: { colors: ['#2c2752', '#1c3a3a'] },
  gradientNotif: { colors: ['#3b2531', '#2b2650'] },
  tint: hexToRgba,
};

// Investment-by-type chart colors — static in the prototype (not theme-dependent).
export const TYPE_COLORS: Record<string, string> = {
  Regular: '#6f66e8',
  'Senior Citizen': '#0ea472',
  'Tax Saver': '#c9861a',
  NRE: '#e2793f',
  NRO: '#b06fd6',
  Corporate: '#5b9ee0',
};

// 135deg linear-gradient ≈ top-left to bottom-right in react-native-linear-gradient's unit-square coordinates.
export const GRADIENT_ANGLE = { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } };
