import React, { useEffect } from 'react';
import { Divider } from 'react-native-astryx/Divider';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, cancelAnimation, Easing } from 'react-native-reanimated';
import { Alert, AlertAction, AlertContent, AlertDescription, AlertIcon } from '@/components/alert';
import { Button as BeuiButton, StatefulButton } from '@/components/button';
import { Card as BeuiCard } from '@/components/card';
import { Loader } from '@/components/loader';
import { useEnter } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { FONT, HAIRLINE, SHAPE, SPACE, TYPE } from '@/design-system/tokens';
import { AppText } from './Text';
import { Icon, type IconName } from '@/icons/Icon';
import { haptic } from './haptics';

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
    <Animated.View style={enter}>
      <BeuiCard variant={raised ? 'muted' : 'outlined'} size="compact" style={[{ padding }, style]}>
        {children}
      </BeuiCard>
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
  const beuiVariant = variant === 'danger' ? 'outline' : variant;
  const dangerStyle = variant === 'danger' ? { borderColor: colors.danger } : undefined;
  const handlePress = () => {
    haptic.tap();
    onPress();
  };

  if (loading) {
    return (
      <StatefulButton
        variant={beuiVariant}
        size="lg"
        state="loading"
        loadingText={label}
        disabled={disabled}
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        onPress={handlePress}
        style={[fullWidth && styles.fullWidth, dangerStyle]}
      >
        {label}
      </StatefulButton>
    );
  }

  return (
    <BeuiButton
      variant={beuiVariant}
      size="lg"
      disabled={disabled}
      startIcon={icon ? ({ size, color }) => <Icon name={icon} size={size} color={variant === 'danger' ? colors.danger : String(color)} /> : undefined}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      onPress={handlePress}
      style={[fullWidth && styles.fullWidth, dangerStyle]}
    >
      {label}
    </BeuiButton>
  );
}

/** An interactive beUI Card row for navigation lists and settings. */
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
  const tone = danger ? colors.danger : colors.content;
  return (
    <Animated.View style={enter}>
      <BeuiCard
        variant="outlined"
        size="compact"
        accessibilityRole="button"
        accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
        onPress={() => {
          haptic.select();
          onPress();
        }}
        style={styles.actionRow}
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
      </BeuiCard>
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

/** A beUI Card with beUI's animated Loader while data loads. */
export function LoadingCard({ height = 120 }: { height?: number; lines?: number }) {
  return (
    <Card>
      <View style={[styles.loaderWrap, { minHeight: height }]}>
        <Loader variant="spinner" size={28} label="Loading" />
      </View>
    </Card>
  );
}

export function EmptyState({ icon, title, message }: { icon: IconName; title: string; message: string }) {
  const { colors } = useTheme();
  const enter = useEnter(0, { distance: 10 });
  return (
    <Animated.View style={enter}>
      <BeuiCard variant="outlined" size="compact" style={styles.emptyContent}>
        <Icon name={icon} size={28} color={colors.muted} />
        <AppText variant="titleMedium" align="center">
          {title}
        </AppText>
        <AppText variant="bodySmall" color={colors.muted} align="center">
          {message}
        </AppText>
      </BeuiCard>
    </Animated.View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertIcon />
      <AlertContent>
        <AlertDescription>{message}</AlertDescription>
        <AlertAction>
          <Button label="Try again" icon="refresh" variant="secondary" onPress={onRetry} />
        </AlertAction>
      </AlertContent>
    </Alert>
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
  return (
    <View style={{ marginVertical: spacing }}>
      <Divider />
    </View>
  );
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
  loaderWrap: { alignItems: 'center', justifyContent: 'center' },
  emptyContent: { padding: SPACE.xl, alignItems: 'center', gap: SPACE.xs },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: SPACE.sm },
  pulseWrap: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position: 'absolute', width: 14, height: 14, borderRadius: 7 },
  pulseCore: { width: 8, height: 8, borderRadius: 4 },
});

export { TYPE };
