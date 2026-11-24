import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { DURATION, EMPHASIZED, springFor } from '@/design-system/tokens';

/** Follows the OS "reduce motion" setting. Animations shorten to near-instant when on. */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduce(value);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
  return reduce;
}

/**
 * Entrance: fades and rises into place with an M3E expressive spring. `index`
 * staggers siblings so lists settle in sequence rather than all at once.
 */
export function useEnter(index = 0, options: { base?: number; step?: number; distance?: number } = {}) {
  const { base = 0, step = 55, distance = 18 } = options;
  const reduce = useReduceMotion();
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = reduce
      ? withTiming(1, { duration: 1 })
      : withDelay(base + index * step, withSpring(1, springFor('default-spatial')));
  }, [base, index, progress, reduce, step]);
  return useAnimatedStyle(() => ({
    opacity: Math.min(1, progress.value),
    transform: [{ translateY: (1 - progress.value) * distance }, { scale: 0.985 + 0.015 * progress.value }],
  }));
}

/** Press feedback: squeezes on press-in and springs back, with an optional haptic hook. */
export function usePress(scale = 0.965) {
  const pressed = useSharedValue(0);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - (1 - scale) * pressed.value }],
  }));
  const pressIn = useCallback(() => {
    pressed.value = withSpring(1, springFor('fast-spatial'));
  }, [pressed]);
  const pressOut = useCallback(() => {
    pressed.value = withSpring(0, springFor('default-spatial'));
  }, [pressed]);
  return { style, pressIn, pressOut };
}

/**
 * Animates a number toward `target` on the JS thread. Text cannot be driven by
 * a worklet in RN, so this steps with requestAnimationFrame and eases out.
 */
export function useCountUp(target: number | null, duration = 900): number | null {
  const [value, setValue] = useState<number | null>(target === null ? null : 0);
  const from = useRef(0);
  useEffect(() => {
    if (target === null) {
      setValue(null);
      return;
    }
    const start = from.current;
    const startedAt = Date.now();
    let frame = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - startedAt) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(start + (target - start) * eased);
      setValue(next);
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        from.current = target;
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, target]);
  return value;
}

/** A looping 0 → 1 sweep, used for skeleton shimmer. Stops cleanly on unmount. */
export function useShimmer(): SharedValue<number> {
  const reduce = useReduceMotion();
  const sweep = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    sweep.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.quad) }), -1, false);
    return () => cancelAnimation(sweep);
  }, [reduce, sweep]);
  return sweep;
}

/** Gentle breathing scale, used for the sign-in mark. */
export function useBreathe(amplitude = 0.035) {
  const reduce = useReduceMotion();
  const value = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    value.value = withRepeat(
      withSequence(withTiming(1, { duration: 1800, easing: EMPHASIZED }), withTiming(0, { duration: 1800, easing: EMPHASIZED })),
      -1,
      false,
    );
    return () => cancelAnimation(value);
  }, [reduce, value]);
  return useAnimatedStyle(() => ({ transform: [{ scale: 1 + amplitude * value.value }] }));
}

export { DURATION };
