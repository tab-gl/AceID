import React from 'react';
import { Theme, neutralTheme } from 'react-native-astryx';
import { useTheme } from '@/theme/ThemeProvider';

/** Makes Astryx components follow the app's light/dark mode. Mount inside ThemeProvider. */
export function AstryxTheme({ children }: { children: React.ReactNode }) {
  const { mode } = useTheme();
  return (
    <Theme theme={neutralTheme} mode={mode}>
      {children}
    </Theme>
  );
}
