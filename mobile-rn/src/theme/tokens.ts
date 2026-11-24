import { Easing } from 'react-native-reanimated';
import type { TextStyle } from 'react-native';
import { M3E_SPRINGS } from './m3e-motion.generated';

// Palette, typography and shape follow the Ace ID web client: monochrome
// Paper/Ink with hairline borders, Instrument Serif for display type and
// Figtree for interface text. Danger and success are the only chromatic values.

export type ThemeMode = 'light' | 'dark';

export interface AceColors {
  background: string;
  panel: string;
  panelRaised: string;
  border: string;
  content: string;
  muted: string;
  inverse: string;
  inverseContent: string;
  danger: string;
  success: string;
  scrim: string;
}

export const LIGHT_COLORS: AceColors = {
  background: '#F5F5F2',
  panel: '#FFFFFF',
  panelRaised: '#FBFBF9',
  border: '#D1D1CC',
  content: '#111111',
  muted: '#70706B',
  inverse: '#111111',
  inverseContent: '#F5F5F2',
  danger: '#B42318',
  success: '#067647',
  scrim: 'rgba(17,17,17,0.38)',
};

export const DARK_COLORS: AceColors = {
  background: '#111111',
  panel: '#1A1A1A',
  panelRaised: '#222222',
  border: '#3A3A3A',
  content: '#F5F5F1',
  muted: '#A8A8A2',
  inverse: '#F5F5F1',
  inverseContent: '#111111',
  danger: '#F97066',
  success: '#47CD89',
  scrim: 'rgba(0,0,0,0.62)',
};

export const FONT = {
  serif: 'InstrumentSerif-Regular',
  serifItalic: 'InstrumentSerif-Italic',
  regular: 'Figtree-Regular',
  medium: 'Figtree-Medium',
  semibold: 'Figtree-SemiBold',
  bold: 'Figtree-Bold',
  extrabold: 'Figtree-ExtraBold',
} as const;

export const TYPE = {
  displayXL: { fontFamily: FONT.serif, fontSize: 58, lineHeight: 56, letterSpacing: -1.9 },
  displayLarge: { fontFamily: FONT.serif, fontSize: 46, lineHeight: 46, letterSpacing: -1.5 },
  displayMedium: { fontFamily: FONT.serif, fontSize: 36, lineHeight: 37, letterSpacing: -1.0 },
  headline: { fontFamily: FONT.serif, fontSize: 27, lineHeight: 29, letterSpacing: -0.5 },
  title: { fontFamily: FONT.extrabold, fontSize: 21, lineHeight: 27, letterSpacing: -0.4 },
  titleMedium: { fontFamily: FONT.bold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: FONT.regular, fontSize: 16, lineHeight: 25 },
  bodyMedium: { fontFamily: FONT.regular, fontSize: 14, lineHeight: 21 },
  bodySmall: { fontFamily: FONT.regular, fontSize: 12.5, lineHeight: 18 },
  label: { fontFamily: FONT.extrabold, fontSize: 14, lineHeight: 18 },
  eyebrow: { fontFamily: FONT.bold, fontSize: 11, lineHeight: 14, letterSpacing: 1.3, textTransform: 'uppercase' },
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof TYPE;

export const SPACE = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 28, xxl: 40 } as const;

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

export const HAIRLINE = 1;

export type SpringToken = 'fast-spatial' | 'default-spatial' | 'slow-spatial' | 'fast-effects' | 'default-effects' | 'slow-effects';

export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
}

/**
 * @m3e/web publishes the damping *ratio* (zeta). Reanimated's withSpring takes
 * the absolute damping coefficient c = 2 * zeta * sqrt(k * m).
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

/** Material 3 emphasized easing, for timed transitions. */
export const EMPHASIZED = Easing.bezier(0.2, 0, 0, 1);
export const EMPHASIZED_DECEL = Easing.bezier(0.05, 0.7, 0.1, 1);

export const DURATION = {
  instant: 120,
  short: 220,
  medium: 380,
  long: 620,
  reveal: 720,
} as const;
