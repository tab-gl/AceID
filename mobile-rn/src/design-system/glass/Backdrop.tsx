import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { BlurTarget } from 'react-native-blur-overlay';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * The layer that liquid glass samples. It paints the page background plus soft
 * light pools, so every blurred surface has real colour and depth behind it.
 * Pages must be siblings above it, never inside it.
 */
export function GlassBackdrop() {
  const { colors, mode } = useTheme();
  const dark = mode === 'dark';
  const pool = dark ? '#ffffff' : '#000000';
  const strength = dark ? 0.16 : 0.1;
  return (
    <BlurTarget style={StyleSheet.absoluteFill}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}>
        <Svg width="100%" height="100%" pointerEvents="none">
          <Defs>
            <RadialGradient id="pool-a" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={pool} stopOpacity={strength} />
              <Stop offset="1" stopColor={pool} stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="pool-b" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={pool} stopOpacity={strength * 0.8} />
              <Stop offset="1" stopColor={pool} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="transparent" />
          <Circle cx="18%" cy="12%" r="55%" fill="url(#pool-a)" />
          <Circle cx="92%" cy="58%" r="48%" fill="url(#pool-b)" />
        </Svg>
      </View>
    </BlurTarget>
  );
}
