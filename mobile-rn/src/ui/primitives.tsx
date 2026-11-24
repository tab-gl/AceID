import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, cancelAnimation, interpolate, Easing } from 'react-native-reanimated';
import { useEnter, usePress, useShimmer } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { FONT, HAIRLINE, SHAPE, SPACE, TYPE } from '@/theme/tokens';
import { AppText } from './Text';
import { Icon, type IconName } from '@/icons/Icon';
import { haptic } from './haptics';

// Square surfaces with hairline borders, as on the web. The floating tab bar is
// the one rounded element.

export function Card({
  children,
  style,
  index,
  raised = false,
  padding = SPACE.md,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  index?: number;
  raised?: boolean;
  padding?: number;
}) {
  const { colors } = useTheme();
  const enter = useEnter(index ?? 0);
  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: raised ? colors.panelRaised : colors.panel, borderColor: colors.border, padding },
        style,
        enter,
      ]}
    >
      {children}
    </Animated.View>
  );
}

export function Eyebrow({ children, color }: { children: React.ReactNode; color?: string }) {
  const { colors } = useTheme();
  return (
    <AppText variant="eyebrow" color={color ?? colors.muted}>
      {children}
    </AppText>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityHint?: string;
}) {
  const { colors } = useTheme();
  const press = usePress(0.96);
  const inactive = disabled || loading;

  const palette = {
    primary: { bg: colors.inverse, fg: colors.inverseContent, border: colors.inverse },
    secondary: { bg: colors.panel, fg: colors.content, border: colors.border },
    ghost: { bg: 'transparent', fg: colors.content, border: 'transparent' },
    danger: { bg: 'transparent', fg: colors.danger, border: colors.danger },
  }[variant];

  return (
    <Animated.View style={[press.style, fullWidth && styles.fullWidth]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: inactive, busy: loading }}
        disabled={inactive}
        onPressIn={press.pressIn}
        onPressOut={press.pressOut}
        onPress={() => {
          haptic.tap();
          onPress();
        }}
        style={[
          styles.button,
          { backgroundColor: palette.bg, borderColor: palette.border },
          disabled && styles.disabled,
          fullWidth && styles.fullWidth,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={palette.fg} />
        ) : (
          <View style={styles.buttonInner}>
            {icon ? <Icon name={icon} size={18} color={palette.fg} /> : null}
            <AppText variant="label" color={palette.fg}>
              {label}
            </AppText>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

/** A quiet tappable row used for navigation lists and settings. */
export function ActionRow({
  icon,
  title,
  subtitle,
  onPress,
  danger = false,
  index,
  trailing,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
  index?: number;
  trailing?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const enter = useEnter(index ?? 0);
  const press = usePress(0.985);
  const tone = danger ? colors.danger : colors.content;
  return (
    <Animated.View style={[enter, press.style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
        onPressIn={press.pressIn}
        onPressOut={press.pressOut}
        onPress={() => {
          haptic.select();
          onPress();
        }}
        style={[styles.actionRow, { borderColor: colors.border, backgroundColor: colors.panel }]}
      >
        <View style={[styles.iconTile, { borderColor: colors.border }]}>
          <Icon name={icon} size={20} color={tone} />
        </View>
        <View style={styles.flex}>
          <AppText variant="titleMedium" color={tone}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="bodySmall" color={colors.muted}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {trailing ?? <Icon name="chevron" size={18} color={colors.muted} />}
      </Pressable>
    </Animated.View>
  );
}

export function Avatar({ name, url, size = 48 }: { name: string; url?: string; size?: number }) {
  const { colors } = useTheme();
  const letter = (name.trim()[0] ?? 'A').toUpperCase();
  const scale = useSharedValue(0);
  useEffect(() => {
    scale.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.back(1.4)) });
    return () => cancelAnimation(scale);
  }, [scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: 0.6 + 0.4 * scale.value }], opacity: scale.value }));
  return (
    <Animated.View
      style={[
        styles.avatar,
        { width: size, height: size, borderColor: colors.border, backgroundColor: colors.inverse },
        style,
      ]}
      accessibilityLabel={`${name} avatar`}
    >
      {url ? (
        <Image source={{ uri: url }} style={{ width: size, height: size }} accessibilityIgnoresInvertColors />
      ) : (
        <AppText variant="headline" color={colors.inverseContent} style={{ fontSize: size * 0.46, lineHeight: size * 0.5 }}>
          {letter}
        </AppText>
      )}
    </Animated.View>
  );
}

export function Skeleton({ width, height = 14, radius = SHAPE.extraSmall }: { width: number | `${number}%`; height?: number; radius?: number }) {
  const { colors } = useTheme();
  const sweep = useShimmer();
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(sweep.value, [0, 1], [-160, 160]) }],
  }));
  return (
    <View style={[styles.skeleton, { width, height, borderRadius: radius, backgroundColor: colors.border }]}>
      <Animated.View style={[StyleSheet.absoluteFill, style]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.panelRaised }, styles.shimmer]} />
      </Animated.View>
    </View>
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <Card>
      <View style={{ gap: SPACE.sm }}>
        <Skeleton width="42%" height={18} />
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton key={index} width={index === lines - 1 ? '62%' : '100%'} />
        ))}
      </View>
    </Card>
  );
}

export function EmptyState({ icon, title, message }: { icon: IconName; title: string; message: string }) {
  const { colors } = useTheme();
  const enter = useEnter(0, { distance: 10 });
  return (
    <Animated.View style={[styles.empty, { borderColor: colors.border }, enter]}>
      <Icon name={icon} size={28} color={colors.muted} />
      <AppText variant="titleMedium" align="center">
        {title}
      </AppText>
      <AppText variant="bodySmall" color={colors.muted} align="center">
        {message}
      </AppText>
    </Animated.View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { colors } = useTheme();
  const enter = useEnter(0, { distance: 10 });
  return (
    <Animated.View style={[styles.errorBox, { borderColor: colors.danger }, enter]} accessibilityRole="alert">
      <View style={styles.errorRow}>
        <Icon name="alert" size={20} color={colors.danger} />
        <AppText variant="bodyMedium" color={colors.danger} style={styles.flex}>
          {message}
        </AppText>
      </View>
      <Button label="Try again" icon="refresh" variant="secondary" onPress={onRetry} />
    </Animated.View>
  );
}

export function SectionHeader({ title, count }: { title: string; count?: number | null }) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <AppText variant="headline">{title}</AppText>
      {count !== undefined && count !== null ? (
        <AppText variant="bodySmall" color={colors.muted} style={{ fontFamily: FONT.bold }}>
          {String(count).padStart(2, '0')}
        </AppText>
      ) : null}
    </View>
  );
}

/** A thin hairline divider. */
export function Rule({ spacing = SPACE.md }: { spacing?: number }) {
  const { colors } = useTheme();
  return <View style={{ height: HAIRLINE, backgroundColor: colors.border, marginVertical: spacing }} />;
}

/** Shows the spinning ring while `active`, then settles. Used for live status indicators. */
export function PulseDot({ active, color }: { active: boolean; color: string }) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (!active) {
      cancelAnimation(pulse);
      pulse.value = 0;
      return;
    }
    pulse.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }), -1, false);
    return () => cancelAnimation(pulse);
  }, [active, pulse]);
  const ring = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 1.8 }],
    opacity: 0.45 * (1 - pulse.value),
  }));
  return (
    <View style={styles.pulseWrap}>
      <Animated.View style={[styles.pulseRing, { backgroundColor: color }, ring]} />
      <View style={[styles.pulseCore, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  disabled: { opacity: 0.45 },
  shimmer: { opacity: 0.55 },
  card: { borderWidth: HAIRLINE, borderRadius: SHAPE.extraSmall, overflow: 'hidden' },
  button: {
    minHeight: 50,
    paddingHorizontal: SPACE.lg,
    borderRadius: SHAPE.full,
    borderWidth: HAIRLINE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonInner: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs },
  fullWidth: { alignSelf: 'stretch', width: '100%' },
  flex: { flex: 1 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    padding: SPACE.md,
    borderWidth: HAIRLINE,
    borderRadius: SHAPE.extraSmall,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderWidth: HAIRLINE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    borderWidth: HAIRLINE,
    borderRadius: SHAPE.full,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeleton: { overflow: 'hidden' },
  empty: {
    borderWidth: HAIRLINE,
    borderStyle: 'dashed',
    padding: SPACE.xl,
    alignItems: 'center',
    gap: SPACE.xs,
  },
  errorBox: { borderWidth: HAIRLINE, padding: SPACE.md, gap: SPACE.md, borderRadius: SHAPE.extraSmall },
  errorRow: { flexDirection: 'row', gap: SPACE.sm, alignItems: 'flex-start' },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: SPACE.sm },
  pulseWrap: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position: 'absolute', width: 14, height: 14, borderRadius: 7 },
  pulseCore: { width: 8, height: 8, borderRadius: 4 },
});

export { TYPE };
