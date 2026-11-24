import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, cancelAnimation, Easing } from 'react-native-reanimated';
import { useEnter, usePress } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { FONT, GLASS, HAIRLINE, SHAPE, SPACE, TYPE } from '@/design-system/tokens';
import { GlassSurface } from '@/design-system/glass';
import { LoadingBlock, LoadingIndicator } from '@/design-system/loading';
import { AppText } from './Text';
import { Icon, type IconName } from '@/icons/Icon';
import { haptic } from './haptics';

// Every control and panel is Liquid Glass. Loading and progress states use the M3
// Expressive indicators from the design system, never glass.

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
  const enter = useEnter(index ?? 0);
  return (
    <Animated.View style={[enter]}>
      <GlassSurface tone={raised ? 'raised' : 'panel'} radius={GLASS.radius.card} contentStyle={[{ padding }, style]}>
        {children}
      </GlassSurface>
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
  const [pressed, setPressed] = useState(false);
  const inactive = disabled || loading;

  const palette = {
    primary: { tone: 'inverse' as const, fg: colors.inverseContent },
    secondary: { tone: 'panel' as const, fg: colors.content },
    ghost: { tone: null, fg: colors.content },
    danger: { tone: 'danger' as const, fg: colors.danger },
  }[variant];

  return (
    <Animated.View style={[press.style, fullWidth && styles.fullWidth]}>
      {palette.tone ? (
        <GlassSurface
          tone={palette.tone}
          blur={false}
          interactive
          pressed={pressed && !inactive}
          radius={GLASS.radius.capsule}
          style={[styles.button, disabled && styles.disabled, fullWidth && styles.fullWidth]}
          contentStyle={styles.buttonContent}
        >
          <ButtonBody loading={loading} icon={icon} label={label} color={palette.fg} />
        </GlassSurface>
      ) : (
        <View style={[styles.button, styles.buttonContent, disabled && styles.disabled, fullWidth && styles.fullWidth]}>
          <ButtonBody loading={loading} icon={icon} label={label} color={palette.fg} />
        </View>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: inactive, busy: loading }}
        disabled={inactive}
        onPressIn={() => {
          setPressed(true);
          press.pressIn();
        }}
        onPressOut={() => {
          setPressed(false);
          press.pressOut();
        }}
        onPress={() => {
          haptic.tap();
          onPress();
        }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

function ButtonBody({ loading, icon, label, color }: { loading: boolean; icon?: IconName; label: string; color: string }) {
  if (loading) return <LoadingIndicator size={24} color={color} containerColor="transparent" />;
  return (
    <View style={styles.buttonInner}>
      {icon ? <Icon name={icon} size={18} color={color} /> : null}
      <AppText variant="label" color={color}>
        {label}
      </AppText>
    </View>
  );
}

/** A glass row for navigation lists and settings. */
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
  const [pressed, setPressed] = useState(false);
  const tone = danger ? colors.danger : colors.content;
  return (
    <Animated.View style={[enter, press.style]}>
      <GlassSurface radius={GLASS.radius.card} pressed={pressed} contentStyle={styles.actionRow}>
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
      </GlassSurface>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
        onPressIn={() => {
          setPressed(true);
          press.pressIn();
        }}
        onPressOut={() => {
          setPressed(false);
          press.pressOut();
        }}
        onPress={() => {
          haptic.select();
          onPress();
        }}
        style={StyleSheet.absoluteFill}
      />
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

/** A card that shows the M3 Expressive loading indicator while its data loads. */
export function LoadingCard({ height = 120 }: { height?: number; lines?: number }) {
  return (
    <Card>
      <LoadingBlock height={height} />
    </Card>
  );
}

export function EmptyState({ icon, title, message }: { icon: IconName; title: string; message: string }) {
  const { colors } = useTheme();
  const enter = useEnter(0, { distance: 10 });
  return (
    <Animated.View style={enter}>
      <GlassSurface radius={GLASS.radius.card} contentStyle={styles.emptyContent}>
        <Icon name={icon} size={28} color={colors.muted} />
        <AppText variant="titleMedium" align="center">
          {title}
        </AppText>
        <AppText variant="bodySmall" color={colors.muted} align="center">
          {message}
        </AppText>
      </GlassSurface>
    </Animated.View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { colors } = useTheme();
  const enter = useEnter(0, { distance: 10 });
  return (
    <Animated.View style={enter} accessibilityRole="alert">
      <GlassSurface tone="danger" radius={GLASS.radius.card} contentStyle={styles.errorContent}>
        <View style={styles.errorRow}>
          <Icon name="alert" size={20} color={colors.danger} />
          <AppText variant="bodyMedium" color={colors.danger} style={styles.flex}>
            {message}
          </AppText>
        </View>
        <Button label="Try again" icon="refresh" variant="secondary" onPress={onRetry} />
      </GlassSurface>
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
  button: { minHeight: 50, borderRadius: SHAPE.full, overflow: 'hidden' },
  buttonContent: { minHeight: 50, paddingHorizontal: SPACE.lg, alignItems: 'center', justifyContent: 'center' },
  buttonInner: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs },
  fullWidth: { alignSelf: 'stretch', width: '100%' },
  flex: { flex: 1 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md, padding: SPACE.md },
  iconTile: {
    width: 40,
    height: 40,
    borderWidth: HAIRLINE,
    borderRadius: SHAPE.medium,
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
  empty: {
    borderWidth: HAIRLINE,
    borderStyle: 'dashed',
    padding: SPACE.xl,
    alignItems: 'center',
    gap: SPACE.xs,
  },
  emptyContent: { padding: SPACE.xl, alignItems: 'center', gap: SPACE.xs },
  errorContent: { padding: SPACE.md, gap: SPACE.md },
  errorRow: { flexDirection: 'row', gap: SPACE.sm, alignItems: 'flex-start' },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: SPACE.sm },
  pulseWrap: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position: 'absolute', width: 14, height: 14, borderRadius: 7 },
  pulseCore: { width: 8, height: 8, borderRadius: 4 },
});

export { TYPE };
