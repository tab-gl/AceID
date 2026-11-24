import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LOGO_PATH } from '@/icons/logo-path';
import { useTheme } from '@/theme/ThemeProvider';

// The logo path is the full lockup (fingerprint mark over the "Ace ID"
// wordmark) on a 512 unit canvas. The crop below frames just that lockup.
const LOCKUP_VIEWBOX = '130 128 252 356';
const LOCKUP_ASPECT = 252 / 356;

/** The Ace ID logo lockup, drawn in the current content colour. */
export function Logo({ height, color }: { height: number; color?: string }) {
  const { colors } = useTheme();
  const fill = color ?? colors.content;
  const width = height * LOCKUP_ASPECT;
  return (
    <Svg width={width} height={height} viewBox={LOCKUP_VIEWBOX} accessibilityLabel="Ace ID logo">
      <Path d={LOGO_PATH} fill={fill} fillRule="evenodd" />
    </Svg>
  );
}

export function Brand({ height = 44 }: { height?: number }) {
  return (
    <View accessibilityRole="header" accessibilityLabel="Ace ID">
      <Logo height={height} />
    </View>
  );
}
