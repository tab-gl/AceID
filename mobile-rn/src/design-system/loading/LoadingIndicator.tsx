import React, { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useMonochrome, useReduceMotion } from '@/design-system/hooks';
import { SHAPE_RADII } from './shapes';
import { LOADING_DURATION_MS, loadingFrame, shapePath } from './morph';
import { SHAPE_ORDER } from './shape-paths';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Material 3 Expressive loading indicator: an active shape that morphs through the
// seven M3 shapes while turning. Contained sits on a container circle, uncontained
// stands alone. Used for loading states and authentication steps. It is not
// used for the application's chrome.

const CONTAINER_SIZE = 48;
const ACTIVE_SIZE = 38;
const SOFT_BURST = SHAPE_ORDER.indexOf('soft-burst');

export interface LoadingIndicatorProps {
  /** Size of the active shape. The container scales with it. */
  size?: number;
  contained?: boolean;
  /** Overrides the active colour, for example to match a button's foreground. */
  color?: string;
  /** Overrides the container colour (contained only). */
  containerColor?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function LoadingIndicator({
  size = ACTIVE_SIZE,
  contained = false,
  color,
  containerColor,
  accessibilityLabel = 'Loading',
  style,
}: LoadingIndicatorProps) {
  const m3 = useMonochrome();
  const reduce = useReduceMotion();
  const clock = useSharedValue(0);

  useEffect(() => {
    if (reduce) {
      cancelAnimation(clock);
      clock.value = 0;
      return;
    }
    clock.value = withRepeat(withTiming(1, { duration: LOADING_DURATION_MS, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(clock);
  }, [clock, reduce]);

  const half = size / 2;
  const animatedProps = useAnimatedProps(() => ({
    d: reduce
      ? shapePath(SHAPE_RADII[SOFT_BURST], half, half, half, 0)
      : loadingFrame(clock.value, SHAPE_RADII, half, half, half),
  }));

  const container = contained ? Math.round((size * CONTAINER_SIZE) / ACTIVE_SIZE) : size;
  const activeColor = color ?? (contained ? m3.onPrimaryContainer : m3.primary);
  const background = contained ? (containerColor ?? m3.secondaryContainer) : 'transparent';

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ busy: true }}
      style={[
        styles.container,
        { width: container, height: container, borderRadius: container / 2, backgroundColor: background },
        style,
      ]}
    >
      <Svg width={size} height={size}>
        <AnimatedPath animatedProps={animatedProps} fill={activeColor} />
      </Svg>
    </View>
  );
}

/** A centred contained indicator in a block of a fixed height: a loading placeholder. */
export function LoadingBlock({ height = 120, label = 'Loading' }: { height?: number; label?: string }) {
  return (
    <View style={[styles.block, { height }]}>
      <LoadingIndicator contained accessibilityLabel={label} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  block: { alignItems: 'center', justifyContent: 'center' },
});
