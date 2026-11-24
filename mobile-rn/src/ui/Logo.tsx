import React, { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { LOGO_PATH } from '@/icons/logo-path';
import { useReduceMotion } from '@/motion';
import { springFor } from '@/design-system/tokens';
import { useTheme } from '@/theme/ThemeProvider';

// The logo path is the full lockup (fingerprint mark over the wordmark) on a
// 512 unit canvas. The viewBox frames only that lockup.
const LOCKUP_VIEWBOX = '130 128 252 356';
const LOCKUP_ASPECT = 252 / 356;

/** The Ace ID lockup in the current content colour, springing into place on mount. */
export function Logo({ height, color, delay = 0, animate = true }: { height: number; color?: string; delay?: number; animate?: boolean }) {
  const { colors } = useTheme();
  const reduce = useReduceMotion();
  const progress = useSharedValue(animate && !reduce ? 0 : 1);
  useEffect(() => {
    if (!animate || reduce) return;
    progress.value = withDelay(delay, withSpring(1, springFor('default-spatial')));
  }, [animate, delay, progress, reduce]);
  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, progress.value),
    transform: [{ scale: 0.82 + 0.18 * progress.value }, { translateY: (1 - progress.value) * 10 }],
  }));
  const width = height * LOCKUP_ASPECT;
  return (
    <Animated.View style={style} accessibilityRole="image" accessibilityLabel="Ace ID">
      <Svg width={width} height={height} viewBox={LOCKUP_VIEWBOX}>
        <Path d={LOGO_PATH} fill={color ?? colors.content} fillRule="evenodd" />
      </Svg>
    </Animated.View>
  );
}
