import { useMemo } from 'react';
import { Platform } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { chooseGlassMode, type GlassMode } from '@/design-system/glass/capability';
import { monochromeRoles, type MonochromeRoles } from '@/design-system/tokens/m3-monochrome';

export { useReduceMotion } from '@/motion';

/** The Liquid Glass rendering mode for this device, fixed for the app's life. */
export function useGlassMode(): GlassMode {
  return useMemo(() => chooseGlassMode({ os: Platform.OS, version: Platform.Version }), []);
}

/** Monochrome M3 roles for the current theme (progress and loading indicators). */
export function useMonochrome(): MonochromeRoles {
  const { mode } = useTheme();
  return useMemo(() => monochromeRoles(mode === 'dark'), [mode]);
}
