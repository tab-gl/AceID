import type { TextStyle } from 'react-native';
import { M3E_SPRINGS } from './m3e-motion.generated';

// Palette, typography and shape are the Ace ID web/Android values:
// monochrome Paper/Ink with hairline borders, Instrument Serif display type,
// Satoshi UI type, and square surfaces (the floating nav bar is the one
// rounded element).
export type ThemeMode = 'light' | 'dark';

export interface AceColors {
  background: string;
  panel: string;
  border: string;
  content: string;
  muted: string;
}

export const LIGHT_COLORS: AceColors = {
  background: '#F5F5F2',
  panel: '#FFFFFF',
  border: '#D1D1CC',
  content: '#111111',
  muted: '#70706B',
};

export const DARK_COLORS: AceColors = {
  background: '#111111',
  panel: '#1A1A1A',
  border: '#3A3A3A',
  content: '#F5F5F1',
  muted: '#A8A8A2',
};

export const FONTS = {
  display: 'InstrumentSerif-Regular',
  ui: 'Satoshi-Variable',
} as const;

export const TYPE = {
  displayLarge: { fontFamily: FONTS.display, fontSize: 48, lineHeight: 47, letterSpacing: -1.6 },
  displayMedium: { fontFamily: FONTS.display, fontSize: 38, lineHeight: 39, letterSpacing: -1.1 },
  headlineLarge: { fontFamily: FONTS.display, fontSize: 30, lineHeight: 32, letterSpacing: -0.6 },
  headlineMedium: { fontFamily: FONTS.display, fontSize: 25, lineHeight: 28, letterSpacing: -0.35 },
  titleLarge: { fontFamily: FONTS.ui, fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  titleMedium: { fontFamily: FONTS.ui, fontSize: 16, fontWeight: '700' },
  bodyLarge: { fontFamily: FONTS.ui, fontSize: 16, lineHeight: 25 },
  bodyMedium: { fontFamily: FONTS.ui, fontSize: 14, lineHeight: 21 },
  bodySmall: { fontFamily: FONTS.ui, fontSize: 12.5, lineHeight: 18 },
  labelLarge: { fontFamily: FONTS.ui, fontSize: 14, fontWeight: '800' },
  labelSmall: { fontFamily: FONTS.ui, fontSize: 11, fontWeight: '700', letterSpacing: 0.45 },
} satisfies Record<string, TextStyle>;

// Material 3 shape scale (corner radii in dp, as published by @m3e/web).
export const SHAPE = {
  none: 0,
  extraSmall: 4,
  small: 8,
  medium: 12,
  large: 16,
  extraLarge: 28,
  full: 9999,
} as const;

export type SpringToken = 'fast-spatial' | 'default-spatial' | 'slow-spatial' | 'fast-effects' | 'default-effects' | 'slow-effects';

export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
}

/**
 * m3e publishes damping *ratio* (zeta). Reanimated's withSpring takes the
 * absolute damping coefficient c = 2 * zeta * sqrt(k * m).
 */
export function springFor(token: SpringToken, scheme: 'standard' | 'expressive' = 'expressive'): SpringConfig {
  const s = M3E_SPRINGS[scheme][token];
  const mass = 1;
  return {
    stiffness: s.stiffness,
    damping: 2 * s.damping * Math.sqrt(s.stiffness * mass),
    mass,
  };
}
