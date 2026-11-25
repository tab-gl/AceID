import React from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACE } from '@/design-system/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useEnter } from '@/motion';
import { AppText } from './Text';
import { Eyebrow } from './primitives';
import { LinearProgress } from '@/design-system/progress';
import { useMonochrome } from '@/design-system/hooks';

export const TAB_BAR_CLEARANCE = 112;

/**
 * A tab page: a scroll view with a large serif title that compresses and fades
 * as the page scrolls, and pull-to-refresh.
 */
export function PageScroll({
  eyebrow,
  title,
  subtitle,
  refreshing = false,
  onRefresh,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  const m3 = useMonochrome();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  const titleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 90], [1, 0.25], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(scrollY.value, [0, 90], [0, -14], Extrapolation.CLAMP) },
      { scale: interpolate(scrollY.value, [-120, 0, 90], [1.04, 1, 0.97], Extrapolation.CLAMP) },
    ],
  }));
  const header = useEnter(0, { distance: 12 });

  return (
    <Animated.ScrollView
      onScroll={onScroll}
      scrollEventThrottle={16}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + SPACE.lg, paddingBottom: insets.bottom + TAB_BAR_CLEARANCE },
      ]}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={m3.primary}
            colors={[m3.primary]}
            progressBackgroundColor={m3.surfaceContainerHigh}
          />
        ) : undefined
      }
    >
      <Animated.View style={[styles.header, header, titleStyle]}>
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <AppText variant="displayMedium" accessibilityRole="header">
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="body" color={colors.muted}>
            {subtitle}
          </AppText>
        ) : null}
      </Animated.View>
      {refreshing ? (
        <LinearProgress indeterminate wavy label="Syncing your account" style={styles.sync} />
      ) : null}
      <View style={styles.body}>{children}</View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: SPACE.md, gap: SPACE.lg },
  header: { gap: SPACE.xs, paddingTop: SPACE.xs, paddingBottom: SPACE.xs },
  body: { gap: SPACE.md },
  sync: { marginTop: SPACE.xs },
});
