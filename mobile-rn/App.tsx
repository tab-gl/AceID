import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { MainShell } from '@/navigation/MainShell';
import { SignInScreen } from '@/screens/SignInScreen';
import { AstryxTheme } from '@/theme/AstryxTheme';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { Logo } from '@/ui/Logo';
import { ToastProvider } from '@/ui/Toast';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AstryxTheme>
            <ToastProvider>
              <AuthProvider>
                <RootGate />
              </AuthProvider>
            </ToastProvider>
          </AstryxTheme>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Splash while the session is restored, then sign-in or the signed-in shell. */
function RootGate() {
  const { status } = useAuth();
  const { colors } = useTheme();
  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      {status === 'loading' ? (
        <Animated.View key="splash" exiting={FadeOut.duration(260)} style={styles.center}>
          <Logo height={64} delay={0} />
        </Animated.View>
      ) : status === 'signedIn' ? (
        <Animated.View key="app" entering={FadeIn.duration(420)} style={styles.flex}>
          <MainShell />
        </Animated.View>
      ) : (
        <Animated.View key="signin" entering={FadeIn.duration(420)} exiting={FadeOut.duration(260)} style={styles.flex}>
          <SignInScreen />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
});
