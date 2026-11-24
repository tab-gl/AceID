import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SHAPE, TYPE, springFor } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { OutlineButton, PrimaryButton } from './ui';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/* ---------- Toast ---------- */

interface ToastValue {
  show: (message: string) => void;
}

const ToastContext = createContext<ToastValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progress = useSharedValue(0);

  const show = useCallback((next: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(next);
    // Reanimated shared values are written from event handlers by design.
    // eslint-disable-next-line react-hooks/immutability
    progress.value = withSpring(1, springFor('default-spatial'));
    timer.current = setTimeout(() => {
      progress.value = withSpring(0, springFor('default-effects'));
      setTimeout(() => setMessage(null), 250);
    }, 2600);
  }, [progress]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const value = useMemo(() => ({ show }), [show]);
  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 16 }],
  }));

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message !== null ? (
        <Animated.View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={[styles.toast, { bottom: insets.bottom + 96, backgroundColor: colors.content }, style]}
        >
          <Text style={[TYPE.bodySmall, { color: colors.background }]}>{message}</Text>
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

/* ---------- Sheet (bottom sheet) ---------- */

export function Sheet({ visible, onDismiss, title, children }: {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} accessibilityLabel="Close" />
        <View
          accessibilityViewIsModal
          style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border, paddingBottom: insets.bottom + 20 }]}
        >
          <View style={[styles.grab, { backgroundColor: colors.border }]} />
          <Text style={[TYPE.headlineLarge, { color: colors.content, marginBottom: 16 }]}>{title}</Text>
          <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 520 }}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ---------- Confirm dialog ---------- */

export function ConfirmDialog({ visible, title, message, confirmLabel, onConfirm, onCancel }: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.scrim}>
        <View style={[styles.dialog, { backgroundColor: colors.panel, borderColor: colors.border }]} accessibilityViewIsModal>
          <Text style={[TYPE.titleLarge, { color: colors.content }]}>{title}</Text>
          <Text style={[TYPE.bodyMedium, { color: colors.content, marginTop: 10 }]}>{message}</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            <View style={{ flex: 1 }}>
              <OutlineButton label="Keep connected" onPress={onCancel} />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton label={confirmLabel} onPress={onConfirm} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: SHAPE.extraLarge,
    borderTopRightRadius: SHAPE.extraLarge,
    borderWidth: StyleSheet.hairlineWidth * 2,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  grab: { alignSelf: 'center', width: 40, height: 4, marginBottom: 14 },
  dialog: { margin: 24, borderWidth: StyleSheet.hairlineWidth * 2, padding: 20, borderRadius: SHAPE.none },
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: SHAPE.small,
    alignItems: 'center',
  },
});

