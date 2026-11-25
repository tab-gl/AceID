import React, { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  clamp,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { useMonochrome, useReduceMotion } from '@/design-system/hooks';
import { EMPHASIZED } from '@/design-system/tokens';
import { circularWaveCount, circularWavePath, wavyAmplitudeTarget } from './geometry';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Material 3 Expressive circular progress. Values follow @m3e/web: a 1.6 px radial
// wave amplitude, a 15 px wavelength, one full wave-phase cycle every 8 s, and an
// arc that starts at 12 o'clock. Indeterminate spins the arc and breathes its length.

const AMPLITUDE = 1.6;
const WAVELENGTH = 15;
const WAVE_CYCLE_MS = 8000;
const SPIN_MS = 1400;
const BREATHE_MS = 1300;
const MIN_SWEEP = 0.08;
const MAX_SWEEP = 0.75;

export interface CircularProgressProps {
  /** 0..1. Ignored when `indeterminate`. */
  progress?: number;
  indeterminate?: boolean;
  wavy?: boolean;
  size?: number;
  thickness?: number;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

/** The RN implementation: flat, indeterminate, and the SVG wavy path. */
function ShapeCircularProgress({
  progress = 0,
  indeterminate = false,
  wavy = false,
  size = 48,
  thickness = 4,
  label = 'Progress',
  style,
}: CircularProgressProps) {
  const m3 = useMonochrome();
  const reduce = useReduceMotion();
  const amplitudeMax = wavy ? AMPLITUDE : 0;
  const value = clamp(progress, 0, 1);
  const centre = size / 2;
  const radius = (size - thickness) / 2 - amplitudeMax;
  const waves = circularWaveCount(size, thickness, WAVELENGTH);

  const fraction = useSharedValue(value);
  const amplitude = useSharedValue(wavyAmplitudeTarget(value, amplitudeMax, indeterminate));
  const phase = useSharedValue(0);
  const spin = useSharedValue(0);
  const breathe = useSharedValue(0);

  useEffect(() => {
    if (indeterminate) return;
    fraction.value = reduce ? value : withTiming(value, { duration: 400, easing: EMPHASIZED });
  }, [value, indeterminate, reduce, fraction]);

  useEffect(() => {
    const target = wavyAmplitudeTarget(value, amplitudeMax, indeterminate);
    if (reduce) {
      amplitude.value = target;
      return;
    }
    const rising = target > amplitude.value;
    amplitude.value = withTiming(target, {
      duration: 500,
      easing: rising ? Easing.bezier(0.2, 0, 0, 1) : Easing.bezier(0.3, 0, 0.8, 0.15),
    });
  }, [value, indeterminate, amplitudeMax, reduce, amplitude]);

  useEffect(() => {
    if (!wavy || reduce) {
      cancelAnimation(phase);
      phase.value = 0;
      return;
    }
    phase.value = withRepeat(withTiming(Math.PI * 2, { duration: WAVE_CYCLE_MS, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(phase);
  }, [wavy, reduce, phase]);

  useEffect(() => {
    if (!indeterminate || reduce) {
      cancelAnimation(spin);
      cancelAnimation(breathe);
      spin.value = 0;
      breathe.value = 0;
      return;
    }
    spin.value = withRepeat(withTiming(1, { duration: SPIN_MS, easing: Easing.linear }), -1, false);
    breathe.value = withRepeat(withTiming(1, { duration: BREATHE_MS, easing: Easing.inOut(Easing.ease) }), -1, true);
    return () => {
      cancelAnimation(spin);
      cancelAnimation(breathe);
    };
  }, [indeterminate, reduce, spin, breathe]);

  const animatedProps = useAnimatedProps(() => {
    const start = -Math.PI / 2 + (indeterminate ? spin.value * Math.PI * 2 : 0);
    const sweepTurns = indeterminate ? MIN_SWEEP + (MAX_SWEEP - MIN_SWEEP) * breathe.value : fraction.value;
    return {
      d: circularWavePath(centre, centre, radius, amplitude.value, waves, phase.value, start, sweepTurns * Math.PI * 2),
    };
  });

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={indeterminate ? undefined : { min: 0, max: 100, now: Math.round(value * 100) }}
      accessibilityState={{ busy: indeterminate }}
      style={[{ width: size, height: size }, style]}
    >
      <Svg width={size} height={size}>
        <Circle cx={centre} cy={centre} r={radius} stroke={m3.secondaryContainer} strokeWidth={thickness} fill="none" />
        <AnimatedPath animatedProps={animatedProps} stroke={m3.primary} strokeWidth={thickness} strokeLinecap="round" fill="none" />
      </Svg>
    </View>
  );
}

/** Circular M3E progress, flat or wavy, determinate or indeterminate. Drawn with react-native-svg. */
export function CircularProgress(props: CircularProgressProps) {
  return <ShapeCircularProgress {...props} />;
}
