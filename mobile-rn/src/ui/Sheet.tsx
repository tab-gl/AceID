import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReduceMotion } from '@/motion';
import { DURATION, EMPHASIZED, HAIRLINE, SHAPE, SPACE, springFor } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './Text';
import { haptic } from './haptics';
import { Button } from './primitives';

/**
 * A bottom sheet that springs up over a scrim. Drag the grabber or the sheet
 * down to dismiss; the parent controls `visible`, and the sheet only unmounts
 * after its exit animation finishes.
 */
export function Sheet({
  visible,
  onDismiss,
  title,
  children,
}: {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reduce = useReduceMotion();
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0);
  const drag = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      drag.value = 0;
      progress.value = reduce ? withTiming(1, { duration: 1 }) : withSpring(1, springFor('default-spatial'));
      return;
    }
    if (!mounted) return;
    progress.value = reduce
      ? withTiming(0, { duration: 1 }, (done) => {
          if (done) runOnJS(setMounted)(false);
        })
      : withTiming(0, { duration: DURATION.short, easing: EMPHASIZED }, (done) => {
          if (done) runOnJS(setMounted)(false);
        });
    // `mounted` is intentionally excluded: it only gates the exit animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, drag, progress, reduce]);

  const dismiss = () => {
    haptic.select();
    onDismiss();
  };

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      drag.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      const shouldClose = drag.value > 120 || event.velocityY > 900;
      if (shouldClose) {
        drag.value = withTiming(height, { duration: DURATION.short, easing: EMPHASIZED }, () => {
          runOnJS(dismiss)();
        });
      } else {
        drag.value = withSpring(0, springFor('default-spatial'));
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * height + drag.value }],
  }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <Modal transparent visible={mounted} animationType="none" statusBarTranslucent onRequestClose={dismiss}>
      <GestureHandlerRootView style={styles.flex}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }, scrimStyle]}>
            <Pressable style={styles.flex} onPress={dismiss} accessibilityLabel="Close" />
          </Animated.View>
          <View style={styles.anchor} pointerEvents="box-none">
            <Animated.View
              style={[
                styles.sheet,
                { backgroundColor: colors.panel, borderColor: colors.border, paddingBottom: insets.bottom + SPACE.md },
                sheetStyle,
              ]}
              accessibilityViewIsModal
            >
              <GestureDetector gesture={pan}>
                <View style={styles.grabberZone}>
                  <View style={[styles.grabber, { backgroundColor: colors.border }]} />
                  <AppText variant="headline" style={styles.title}>
                    {title}
                  </AppText>
                </View>
              </GestureDetector>
              <View style={styles.body}>{children}</View>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

/** A confirm dialog built on Sheet: a message and a primary and cancel action. */
export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel,
  destructive = false,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Sheet visible={visible} onDismiss={onCancel} title={title}>
      <View style={styles.confirm}>
        <AppText variant="bodyMedium" color={colors.muted}>
          {message}
        </AppText>
        <Confirmation destructive={destructive} confirmLabel={confirmLabel} onCancel={onCancel} onConfirm={onConfirm} />
      </View>
    </Sheet>
  );
}

function Confirmation({
  destructive,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  destructive: boolean;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <View style={styles.actions}>
      <Button label="Keep it" variant="secondary" onPress={onCancel} />
      <Button label={confirmLabel} variant={destructive ? 'danger' : 'primary'} onPress={onConfirm} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  anchor: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: SHAPE.extraLarge,
    borderTopRightRadius: SHAPE.extraLarge,
    borderTopWidth: HAIRLINE,
    borderLeftWidth: HAIRLINE,
    borderRightWidth: HAIRLINE,
    maxHeight: '92%',
  },
  grabberZone: { alignItems: 'center', paddingTop: SPACE.sm, paddingHorizontal: SPACE.lg, paddingBottom: SPACE.xs, gap: SPACE.sm },
  grabber: { width: 40, height: 4, borderRadius: 2 },
  title: { alignSelf: 'stretch' },
  body: { paddingHorizontal: SPACE.lg, paddingTop: SPACE.md },
  confirm: { gap: SPACE.lg },
  actions: { flexDirection: 'row', gap: SPACE.sm, justifyContent: 'flex-end' },
});
