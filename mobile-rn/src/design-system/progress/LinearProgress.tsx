import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  clamp,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useMonochrome, useReduceMotion } from '@/design-system/hooks';
import { EMPHASIZED } from '@/design-system/tokens';
import { linearWavePath, wavyAmplitudeTarget } from './geometry';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Material 3 Expressive linear progress. Values follow @m3e/web: a 4 px line, a
// 3 px wave amplitude, a 40 px wavelength (24 px when indeterminate) that slides
// once per second, and an amplitude that eases in and out over 500 ms, flattening
// near the ends of the track.

const AMPLITUDE = 3;
const WAVELENGTH = 40;
const WAVELENGTH_INDETERMINATE = 24;
const SLIDE_MS = 1000;
const INDETERMINATE_MS = 2000;

export interface LinearProgressProps {
  /** 0..1. Ignored when `indeterminate`. */
  progress?: number;
  indeterminate?: boolean;
  wavy?: boolean;
  thickness?: number;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

export function LinearProgress({
  progress = 0,
  indeterminate = false,
  wavy = false,
  thickness = 4,
  label = 'Progress',
  style,
}: LinearProgressProps) {
  const m3 = useMonochrome();
  const reduce = useReduceMotion();
  const [width, setWidth] = useState(0);
  const amplitudeMax = wavy ? AMPLITUDE : 0;
  const height = thickness + amplitudeMax * 2;
  const wavelength = indeterminate ? WAVELENGTH_INDETERMINATE : WAVELENGTH;
  const value = clamp(progress, 0, 1);

  const fraction = useSharedValue(value);
  const amplitude = useSharedValue(wavyAmplitudeTarget(value, amplitudeMax, indeterminate));
  const slide = useSharedValue(0);
  const sweep = useSharedValue(0);

  // Determinate value: glides to the new target.
  useEffect(() => {
    if (indeterminate) return;
    fraction.value = reduce ? value : withTiming(value, { duration: 400, easing: EMPHASIZED });
  }, [value, indeterminate, reduce, fraction]);

  // Wave amplitude eases toward its target. Rising uses the M3 decelerate curve,
  // falling the accelerate curve. Flat when reduced motion is on.
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

  // The wave travels one wavelength per second.
  useEffect(() => {
    if (!wavy || reduce) {
      cancelAnimation(slide);
      slide.value = 0;
      return;
    }
    slide.value = 0;
    slide.value = withRepeat(withTiming(wavelength, { duration: SLIDE_MS, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(slide);
  }, [wavy, reduce, wavelength, slide]);

  // Indeterminate: a segment sweeps across the track.
  useEffect(() => {
    if (!indeterminate || reduce) {
      cancelAnimation(sweep);
      sweep.value = 0;
      return;
    }
    sweep.value = 0;
    sweep.value = withRepeat(withTiming(1, { duration: INDETERMINATE_MS, easing: Easing.inOut(Easing.ease) }), -1, false);
    return () => cancelAnimation(sweep);
  }, [indeterminate, reduce, sweep]);

  const centre = height / 2;
  const animatedProps = useAnimatedProps(() => {
    let x0 = 0;
    let x1 = fraction.value * width;
    if (indeterminate) {
      const u = sweep.value;
      x0 = clamp(u * 1.5 - 0.5, 0, 1) * width;
      x1 = clamp(u * 1.5, 0, 1) * width;
    }
    return {
      d: linearWavePath(x0, x1, centre, amplitude.value, wavelength, slide.value),
    };
  });

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={indeterminate ? undefined : { min: 0, max: 100, now: Math.round(value * 100) }}
      accessibilityState={{ busy: indeterminate }}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      style={[styles.wrap, { height }, style]}
    >
      <View style={[styles.track, { height: thickness, top: centre - thickness / 2, borderRadius: thickness / 2, backgroundColor: m3.secondaryContainer }]} />
      {width > 0 ? (
        <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
          <AnimatedPath animatedProps={animatedProps} stroke={m3.primary} strokeWidth={thickness} strokeLinecap="round" fill="none" />
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', overflow: 'visible' },
  track: { position: 'absolute', left: 0, right: 0 },
});
