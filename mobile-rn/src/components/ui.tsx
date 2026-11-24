import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { AceIcon } from '@/icons/AceIcon';
import { SHAPE, TYPE, springFor } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export function Text_({ variant, children, style, color, numberOfLines }: {
  variant: keyof typeof TYPE;
  children: React.ReactNode;
  style?: StyleProp<any>;
  color?: string;
  numberOfLines?: number;
}) {
  const { colors } = useTheme();
  return (
    <Text style={[TYPE[variant], { color: color ?? colors.content }, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

export function Eyebrow({ children }: { children: string }) {
  const { colors } = useTheme();
  return <Text style={[TYPE.labelSmall, { color: colors.content }]}>{children.toUpperCase()}</Text>;
}

/** Scrolling page with pull-to-refresh and room for the floating tab bar. */
export function Page({
  refreshing,
  onRefresh,
  children,
}: {
  refreshing: boolean;
  onRefresh: () => void;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.page}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.content} colors={[colors.content]} />
      }
    >
      {children}
    </ScrollView>
  );
}

export function SectionHeading({ title, count }: { title: string; count?: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[TYPE.titleMedium, { color: colors.content }]}>{title}</Text>
      {count !== undefined ? <Text style={[TYPE.labelSmall, { color: colors.muted }]}>{String(count)}</Text> : null}
    </View>
  );
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View>
      <Text style={[TYPE.labelSmall, { color: colors.muted }]}>{label.toUpperCase()}</Text>
      <Text style={[TYPE.bodyLarge, { color: colors.content }]}>{value}</Text>
    </View>
  );
}

export function Panel({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View style={[{ backgroundColor: colors.panel, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth * 2, padding: 18 }, style]}>
      {children}
    </View>
  );
}

export function Avatar({ letter, size = 52, large = false }: { letter: string; size?: number; large?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.avatar, { width: size, height: size, backgroundColor: colors.content, borderColor: colors.content }]}>
      <Text style={[large ? TYPE.displayMedium : TYPE.headlineMedium, { color: colors.background, fontFamily: TYPE.headlineMedium.fontFamily }]}>
        {letter}
      </Text>
    </View>
  );
}

export function ActionTile({ icon, title, subtitle, onPress, danger = false }: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: colors.panel, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={[styles.iconBox, { borderColor: colors.border }]}>
        <AceIcon name={icon} color={colors.content} size={22} />
      </View>
      <View style={styles.flex}>
        <Text style={[TYPE.titleMedium, { color: colors.content }]}>{title}</Text>
        <Text style={[TYPE.bodySmall, { color: danger ? colors.content : colors.muted }]}>{subtitle}</Text>
      </View>
      <AceIcon name="open" color={colors.muted} size={18} />
    </Pressable>
  );
}

export function DataTile({ icon, title, subtitle, trailing }: {
  icon: string;
  title: string;
  subtitle: string;
  trailing?: string | null;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.tile, { backgroundColor: colors.panel, borderColor: colors.border }]}>
      <View style={[styles.iconBox, { borderColor: colors.border }]}>
        <AceIcon name={icon} color={colors.content} size={22} />
      </View>
      <View style={styles.flex}>
        <Text style={[TYPE.titleMedium, { color: colors.content }]} numberOfLines={1}>{title}</Text>
        <Text style={[TYPE.bodySmall, { color: colors.muted }]} numberOfLines={1}>{subtitle}</Text>
      </View>
      {trailing ? <Text style={[TYPE.labelSmall, { color: colors.muted }]}>{trailing}</Text> : null}
    </View>
  );
}

export function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { colors } = useTheme();
  return (
    <View accessibilityLiveRegion="polite" style={[styles.panelBorder, { borderColor: colors.border, backgroundColor: colors.panel, padding: 14 }]}>
      <Text style={[TYPE.bodySmall, { color: colors.content }]}>{message}</Text>
      <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retry}>
        <AceIcon name="refresh" color={colors.content} size={16} />
        <Text style={[TYPE.labelLarge, { color: colors.content }]}>Try again</Text>
      </Pressable>
    </View>
  );
}

export function EmptyPanel({ message }: { message: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.panelBorder, { borderColor: colors.border, backgroundColor: colors.panel, padding: 16 }]}>
      <Text style={[TYPE.bodySmall, { color: colors.muted }]}>{message}</Text>
    </View>
  );
}

export function Spinner() {
  const { colors } = useTheme();
  return <ActivityIndicator color={colors.content} />;
}

export function LabeledField({ label, value, onChangeText, prefix, keyboardType, autoCapitalize = 'sentences' }: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  prefix?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences';
}) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text style={[TYPE.labelSmall, { color: colors.muted }]}>{label.toUpperCase()}</Text>
      <View style={[styles.field, { borderColor: colors.border, backgroundColor: colors.panel }]}>
        {prefix ? <Text style={[TYPE.bodyLarge, { color: colors.muted }]}>{prefix}</Text> : null}
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          style={[TYPE.bodyLarge, styles.input, { color: colors.content }]}
          placeholderTextColor={colors.muted}
        />
      </View>
    </View>
  );
}

/** Press feedback driven by an m3e expressive spring (default-spatial). */
function usePressScale() {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  // Reanimated shared values are written from event handlers by design.
  const onPressIn = () => {
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(0.97, springFor('default-spatial'));
  };
  const onPressOut = () => {
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(1, springFor('default-spatial'));
  };
  return { style, onPressIn, onPressOut };
}

export function PrimaryButton({ label, onPress, icon, disabled = false, loading = false }: {
  label: string;
  onPress: () => void;
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
}) {
  const { colors } = useTheme();
  const press = usePressScale();
  const inactive = disabled || loading;
  return (
    <Animated.View style={press.style}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: inactive, busy: loading }}
        disabled={inactive}
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={[styles.primary, { backgroundColor: colors.content, opacity: inactive ? 0.6 : 1 }]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.background} />
        ) : icon ? (
          <AceIcon name={icon} color={colors.background} size={18} />
        ) : null}
        <Text style={[TYPE.labelLarge, { color: colors.background }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function OutlineButton({ label, onPress, icon, disabled = false }: {
  label: string;
  onPress: () => void;
  icon?: string;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.outline,
        { borderColor: colors.content, opacity: disabled ? 0.5 : pressed ? 0.7 : 1, backgroundColor: 'transparent' },
      ]}
    >
      {icon ? <AceIcon name={icon} color={colors.content} size={18} /> : null}
      <Text style={[TYPE.labelLarge, { color: colors.content }]}>{label}</Text>
    </Pressable>
  );
}

export function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={styles.link}>
      <Text style={[TYPE.bodySmall, { color: colors.content, textDecorationLine: 'underline' }]}>{label}</Text>
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  page: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 130, gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flex: { flex: 1, gap: 2 },
  tile: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: StyleSheet.hairlineWidth * 2, padding: 16 },
  iconBox: { width: 42, height: 42, borderWidth: StyleSheet.hairlineWidth * 2, alignItems: 'center', justifyContent: 'center' },
  avatar: { borderWidth: 1, alignItems: 'center', justifyContent: 'center', borderRadius: SHAPE.none },
  panelBorder: { borderWidth: StyleSheet.hairlineWidth * 2 },
  retry: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, alignSelf: 'flex-start' },
  field: { flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth * 2, paddingHorizontal: 12, minHeight: 48, gap: 4 },
  input: { flex: 1, paddingVertical: 10 },
  primary: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: SHAPE.none },
  outline: { height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: SHAPE.none },
  link: { paddingVertical: 8, paddingHorizontal: 6 },
});
