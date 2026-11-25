import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar, StyleSheet, useColorScheme, useWindowDimensions, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useReduceMotion } from '@/motion';
import { DARK_COLORS, DURATION, EMPHASIZED, LIGHT_COLORS, type AceColors, type ThemeMode } from '@/design-system/tokens';

const STORAGE_KEY = 'aceid.theme.v1';

export interface Origin {
  x: number;
  y: number;
}

interface ThemeValue {
  mode: ThemeMode;
  colors: AceColors;
  /** Switches light and dark. With an origin, the change radiates out from that point. */
  toggleMode: (origin?: Origin) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme() === 'dark' ? 'dark' : 'light';
  const reduceMotion = useReduceMotion();
  const [mode, setMode] = useState<ThemeMode>(system);
  const { width, height } = useWindowDimensions();

  // Reveal overlay: a circle in the incoming background grows from the tap
  // point, then the theme commits underneath it.
  const [revealColor, setRevealColor] = useState<string | null>(null);
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);
  const radius = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);
  const busy = useRef(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (!cancelled && (saved === 'light' || saved === 'dark')) setMode(saved);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const commit = useCallback((next: ThemeMode) => {
    setMode(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const finishReveal = useCallback(() => {
    busy.current = false;
    setRevealColor(null);
  }, []);

  const commitAndFade = useCallback(
    (next: ThemeMode) => {
      commit(next);
      overlayOpacity.value = withTiming(0, { duration: DURATION.short, easing: EMPHASIZED }, (finished) => {
        if (finished) runOnJS(finishReveal)();
      });
    },
    [commit, finishReveal, overlayOpacity],
  );

  const toggleMode = useCallback(
    (origin?: Origin) => {
      if (busy.current) return;
      const next: ThemeMode = mode === 'dark' ? 'light' : 'dark';
      if (reduceMotion || !origin) {
        commit(next);
        return;
      }
      busy.current = true;
      const maxRadius = Math.hypot(Math.max(origin.x, width - origin.x), Math.max(origin.y, height - origin.y));
      const nextColors = next === 'dark' ? DARK_COLORS : LIGHT_COLORS;
      originX.value = origin.x;
      originY.value = origin.y;
      radius.value = 0;
      overlayOpacity.value = 1;
      setRevealColor(nextColors.background);
      radius.value = withTiming(maxRadius + 4, { duration: DURATION.reveal, easing: EMPHASIZED }, (finished) => {
        if (finished) runOnJS(commitAndFade)(next);
      });
    },
    [commit, commitAndFade, height, mode, originX, originY, overlayOpacity, radius, reduceMotion, width],
  );

  const revealStyle = useAnimatedStyle(() => ({
    width: radius.value * 2,
    height: radius.value * 2,
    borderRadius: radius.value,
    left: originX.value - radius.value,
    top: originY.value - radius.value,
    opacity: overlayOpacity.value,
  }));

  const colors = mode === 'dark' ? DARK_COLORS : LIGHT_COLORS;
  const value = useMemo<ThemeValue>(() => ({ mode, colors, toggleMode }), [colors, mode, toggleMode]);

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={styles.root}>
        {children}
        {revealColor ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Animated.View style={[styles.reveal, { backgroundColor: revealColor }, revealStyle]} />
          </View>
        ) : null}
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  reveal: { position: 'absolute' },
});
