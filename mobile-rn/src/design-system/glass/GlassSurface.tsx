import React, { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import BlurOverlay from 'react-native-blur-overlay';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { EMPHASIZED, GLASS, HAIRLINE, withAlpha, type AceColors } from '@/design-system/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useGlassMode } from '@/design-system/hooks';

export type GlassTone = 'panel' | 'raised' | 'inverse' | 'danger';

interface GlassSurfaceProps extends Omit<ViewProps, 'style'> {
  children?: React.ReactNode;
  /** Layout of the outer surface: size, position, margins. */
  style?: StyleProp<ViewStyle>;
  /** Style of the content layer. Use it for flex direction and padding of the children. */
  contentStyle?: StyleProp<ViewStyle>;
  radius?: number;
  tone?: GlassTone;
  /**
   * Real backdrop blur (react-native-blur-overlay). Only for absolutely positioned
   * chrome such as the tab bar, toasts and scrims: a blur layer does not size its
   * parent. Falls back to the translucent material on devices without blur.
   */
  blur?: boolean;
  /** Glass that responds to touch: on iOS 26 the system's interactive glass. */
  interactive?: boolean;
  /** Brightens the specular sheen and rim while a control is pressed. */
  pressed?: boolean;
  /** Adds a soft drop shadow for floating surfaces. */
  lift?: boolean;
}

/**
 * Liquid Glass surface. Layers, bottom to top: the body (a real blur when `blur`
 * is set and the device supports it, otherwise a translucent material), the specular
 * sheen and rim, then the content.
 */
export function GlassSurface({
  children,
  style,
  contentStyle,
  radius = GLASS.radius.card,
  tone = 'panel',
  blur = false,
  interactive = false,
  pressed = false,
  lift = false,
  ...rest
}: GlassSurfaceProps) {
  const { colors, mode } = useTheme();
  const dark = mode === 'dark';
  const glassMode = useGlassMode();
  const useBlur = blur && glassMode === 'blur';
  const look = bodyFor(colors, tone, dark, useBlur);

  if (useBlur) {
    return (
      <View {...rest} style={[{ borderRadius: radius }, style]}>
        <BlurOverlay
          visible
          blurMode="glass"
          glassVariant="regular"
          glassTint={look.tint}
          interactive={interactive}
          fadeDuration={0}
          style={[StyleSheet.absoluteFill, { borderRadius: radius, borderWidth: HAIRLINE, borderColor: look.border, backgroundColor: look.body }]}
        />
        <Specular radius={radius} dark={dark} pressed={pressed} />
        <View style={[styles.content, contentStyle]}>{children}</View>
      </View>
    );
  }

  return (
    <View
      {...rest}
      style={[
        styles.material,
        lift ? styles.lift : null,
        { borderRadius: radius, borderColor: look.border, backgroundColor: look.body },
        style,
      ]}
    >
      <Specular radius={radius} dark={dark} pressed={pressed} />
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

/** Top sheen and rim. Pure decoration: never takes touches. */
function Specular({ radius, dark, pressed }: { radius: number; dark: boolean; pressed: boolean }) {
  const press = useSharedValue(0);
  useEffect(() => {
    press.value = withTiming(pressed ? 1 : 0, { duration: 180, easing: EMPHASIZED });
  }, [pressed, press]);
  const sheen = useAnimatedStyle(() => ({ opacity: 0.6 + 0.4 * press.value }));
  const sheenColor = dark ? GLASS.sheen.dark : GLASS.sheen.light;
  const rimColor = dark ? GLASS.rim.dark : GLASS.rim.light;
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius, borderWidth: HAIRLINE, borderColor: rimColor }, sheen]}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="glass-sheen" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={sheenColor} stopOpacity="1" />
            <Stop offset="1" stopColor={sheenColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height={`${GLASS.sheenHeight * 100}%`} fill="url(#glass-sheen)" />
      </Svg>
    </Animated.View>
  );
}

function bodyFor(colors: AceColors, tone: GlassTone, dark: boolean, blurred: boolean) {
  // Over a blur the body must be more transparent so the backdrop shows through.
  const bodyAlpha = blurred ? (dark ? GLASS.bodyAlpha.dark : GLASS.bodyAlpha.light) : dark ? GLASS.materialAlpha.dark : GLASS.materialAlpha.light;
  switch (tone) {
    case 'inverse':
      return { body: withAlpha(colors.inverse, 0.92), tint: withAlpha(colors.inverse, 0.6), border: colors.inverse };
    case 'danger':
      return { body: withAlpha(colors.danger, dark ? 0.2 : 0.1), tint: withAlpha(colors.danger, 0.3), border: colors.danger };
    case 'raised':
      return { body: withAlpha(colors.panelRaised, bodyAlpha), tint: withAlpha(colors.panelRaised, 0.5), border: colors.border };
    case 'panel':
    default:
      return { body: withAlpha(colors.panel, bodyAlpha), tint: withAlpha(colors.panel, 0.5), border: colors.border };
  }
}

const styles = StyleSheet.create({
  material: { overflow: 'hidden', borderWidth: HAIRLINE },
  lift: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  content: {},
});
