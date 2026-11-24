import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { HAIRLINE, SHAPE, withAlpha } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

// A native stand-in for the Liquid Glass look of the web `glisse` library.
// glisse is browser-only (window, document, SVG displacement filters) and cannot
// run in React Native, so this recreates its visible traits with what the app
// already ships: a translucent body, a hairline rim, a specular top gradient and
// a soft lift. It does NOT blur what sits behind it; that needs a native blur
// module, which is deliberately not added.

type ViewProps = React.ComponentProps<typeof View>;

interface GlassProps extends Omit<ViewProps, 'style'> {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  /** Lift shadow strength. */
  elevation?: 'flat' | 'lift';
}

export function GlassSurface({ children, style, radius = SHAPE.full, elevation = 'lift', ...rest }: GlassProps) {
  const { colors, mode } = useTheme();
  const isDark = mode === 'dark';
  const rim = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.9)';
  const sheen = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.7)';
  return (
    <View
      {...rest}
      style={[
        styles.body,
        elevation === 'lift' ? styles.lift : null,
        {
          borderRadius: radius,
          backgroundColor: withAlpha(colors.panel, isDark ? 0.74 : 0.8),
          borderColor: isDark ? withAlpha(colors.border, 0.7) : withAlpha(colors.border, 0.85),
        },
        style,
      ]}
    >
      <Svg pointerEvents="none" style={StyleSheet.absoluteFill} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="glass-sheen" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={sheen} stopOpacity="1" />
            <Stop offset="1" stopColor={sheen} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="55%" fill="url(#glass-sheen)" />
      </Svg>
      <View pointerEvents="none" style={[styles.rim, { borderRadius: radius, borderColor: rim }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { overflow: 'hidden', borderWidth: HAIRLINE },
  lift: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  rim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderWidth: HAIRLINE },
});
