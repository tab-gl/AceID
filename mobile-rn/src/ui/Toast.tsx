import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReduceMotion } from '@/motion';
import { EMPHASIZED, HAIRLINE, SHAPE, SPACE, DURATION, springFor } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon } from '@/icons/Icon';
import { AppText } from './Text';
import { haptic } from './haptics';

type Tone = 'neutral' | 'success' | 'danger';

interface ToastValue {
  show: (message: string, tone?: Tone) => void;
}

const ToastContext = createContext<ToastValue | null>(null);

const LIFETIME_MS = 3000;

/** Shows one toast at a time at the bottom of the screen. A new message replaces the old one. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();
  const [current, setCurrent] = useState<{ id: number; message: string; tone: Tone } | null>(null);
  const counter = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progress = useSharedValue(0);

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    progress.value = withTiming(0, { duration: DURATION.short, easing: EMPHASIZED }, (done) => {
      if (done) runOnJS(setCurrent)(null);
    });
  }, [progress]);

  const show = useCallback(
    (message: string, tone: Tone = 'neutral') => {
      if (tone === 'success') haptic.success();
      else if (tone === 'danger') haptic.warning();
      counter.current += 1;
      setCurrent({ id: counter.current, message, tone });
      if (timer.current) clearTimeout(timer.current);
      progress.value = reduce ? 1 : withSpring(1, springFor('default-spatial'));
      timer.current = setTimeout(hide, LIFETIME_MS);
    },
    [hide, progress, reduce],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 24 }, { scale: 0.96 + 0.04 * progress.value }],
  }));

  const value = useMemo(() => ({ show }), [show]);
  const tint = current?.tone === 'danger' ? colors.danger : colors.success;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {current ? (
        <Animated.View
          pointerEvents="box-none"
          style={[styles.wrap, { bottom: insets.bottom + 96 }, style]}
          key={current.id}
          accessibilityLiveRegion="polite"
        >
          <Pressable
            onPress={hide}
            accessibilityRole="alert"
            accessibilityLabel={current.message}
            style={[styles.toast, { backgroundColor: colors.inverse, borderColor: colors.inverse }]}
          >
            <Icon
              name={current.tone === 'danger' ? 'alert' : current.tone === 'success' ? 'check' : 'bell'}
              size={18}
              color={current.tone === 'neutral' ? colors.inverseContent : tint}
            />
            <AppText variant="bodyMedium" color={colors.inverseContent} style={styles.message}>
              {current.message}
            </AppText>
          </Pressable>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastValue {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside ToastProvider');
  return value;
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: SPACE.md, right: SPACE.md, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingVertical: SPACE.sm + 2,
    paddingHorizontal: SPACE.md,
    borderRadius: SHAPE.full,
    borderWidth: HAIRLINE,
    maxWidth: '100%',
  },
  message: { flexShrink: 1 },
});
