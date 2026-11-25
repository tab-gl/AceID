import {
  Hct,
  MaterialDynamicColors,
  SchemeMonochrome,
  argbFromHex,
  hexFromArgb,
  type DynamicColor,
} from '@material/material-color-utilities';

// The official Material Color Utilities monochrome scheme. Used only by the M3
// Expressive progress and loading indicators. Application chrome and glass use the
// AceID palette in tokens/index.ts. The monochrome variant has no hue, so the seed
// only sets the neutral reference; the roles are computed, not hand-picked.

const SEED = argbFromHex('#111111');

export interface MonochromeRoles {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  surface: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  outline: string;
  onSurface: string;
  onSurfaceVariant: string;
  error: string;
}

const cache = new Map<boolean, MonochromeRoles>();

/** Monochrome M3 colour roles for the given theme, computed once per mode. */
export function monochromeRoles(isDark: boolean): MonochromeRoles {
  const cached = cache.get(isDark);
  if (cached) return cached;
  const scheme = new SchemeMonochrome(Hct.fromInt(SEED), isDark, 0);
  const hex = (role: DynamicColor) => hexFromArgb(scheme.getArgb(role));
  const roles: MonochromeRoles = {
    primary: hex(MaterialDynamicColors.primary),
    onPrimary: hex(MaterialDynamicColors.onPrimary),
    primaryContainer: hex(MaterialDynamicColors.primaryContainer),
    onPrimaryContainer: hex(MaterialDynamicColors.onPrimaryContainer),
    secondaryContainer: hex(MaterialDynamicColors.secondaryContainer),
    onSecondaryContainer: hex(MaterialDynamicColors.onSecondaryContainer),
    surface: hex(MaterialDynamicColors.surface),
    surfaceContainerHigh: hex(MaterialDynamicColors.surfaceContainerHigh),
    surfaceContainerHighest: hex(MaterialDynamicColors.surfaceContainerHighest),
    outline: hex(MaterialDynamicColors.outline),
    onSurface: hex(MaterialDynamicColors.onSurface),
    onSurfaceVariant: hex(MaterialDynamicColors.onSurfaceVariant),
    error: hex(MaterialDynamicColors.error),
  };
  cache.set(isDark, roles);
  return roles;
}
