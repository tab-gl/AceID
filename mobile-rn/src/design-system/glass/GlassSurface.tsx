import React, { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import BlurOverlay from 'react-native-blur-overlay';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { EMPHASIZED, GLASS, HAIRLINE, withAlpha, type AceColors } from '@/design-system/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useGlassMode } from '@/design-system/hooks';
import { SafeBoundary } from './SafeBoundary';

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
   * Real backdrop blur, sampled from the GlassBackdrop layer behind the pages.
   * Default on. Set false for content inside a separate window (sheets) and for
   * surfaces that must stay opaque. Falls back to a translucent material where
   * the device has no blur.
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
 * Liquid Glass surface. Layers, bottom to top: the body (live blur of the backdrop
 * when `blur` is set and the device supports it, otherwise a translucent material),
 * the specular sheen clipped to the radius, then the content.
 */
export function GlassSurface({
  children,
  style,
  contentStyle,
  radius = GLASS.radius.card,
  tone = 'panel',
  blur = true,
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

  const outer: StyleProp<ViewStyle> = [
    styles.outer,
    lift ? styles.lift : null,
    { borderRadius: radius, borderColor: look.border, backgroundColor: useBlur ? 'transparent' : look.body },
    style,
  ];
  const body = { borderRadius: radius, backgroundColor: look.body };

  if (useBlur) {
    return (
      <View {...rest} style={outer}>
        <SafeBoundary fallback={<View style={[StyleSheet.absoluteFill, body]} />}>
          <BlurOverlay
            visible
            blurMode="glass"
            glassVariant="regular"
            glassTint={look.tint}
            interactive={interactive}
            fadeDuration={0}
            style={[StyleSheet.absoluteFill, body]}
          />
        </SafeBoundary>
        <Specular radius={radius} dark={dark} pressed={pressed} />
        <View style={[styles.content, contentStyle]}>{children}</View>
      </View>
    );
  }

  return (
    <View {...rest} style={outer}>
      <View style={[StyleSheet.absoluteFill, body]} pointerEvents="none" />
      <Specular radius={radius} dark={dark} pressed={pressed} />
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

/** Top sheen, clipped to the radius by its own wrapper. Pure decoration: never takes touches. */
function Specular({ radius, dark, pressed }: { radius: number; dark: boolean; pressed: boolean }) {
  const press = useSharedValue(0);
  useEffect(() => {
    press.value = withTiming(pressed ? 1 : 0, { duration: 180, easing: EMPHASIZED });
  }, [pressed, press]);
  const sheen = useAnimatedStyle(() => ({ opacity: 0.6 + 0.4 * press.value }));
  const sheenColor = dark ? GLASS.sheen.dark : GLASS.sheen.light;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.clip, { borderRadius: radius }]}>
      <Animated.View style={[StyleSheet.absoluteFill, sheen]}>
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
    </View>
  );
}

function bodyFor(colors: AceColors, tone: GlassTone, dark: boolean, blurred: boolean) {
  // Over a live blur the body is more transparent so the blurred backdrop shows through.
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
  // No overflow clipping here: it cut the edges and the shadow. Clipping happens per layer.
  outer: { borderWidth: HAIRLINE },
  clip: { overflow: 'hidden' },
  lift: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  content: {},
});
