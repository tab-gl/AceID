import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { ToastProvider } from '@/components/Overlays';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <RootNavigator />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { colors } = useTheme();
  const { status } = useAuth();
  const [fontsLoaded] = useFonts({
    'InstrumentSerif-Regular': require('../../assets/fonts/InstrumentSerif-Regular.ttf'),
    'Satoshi-Variable': require('../../assets/fonts/Satoshi-Variable.ttf'),
  });

  if (!fontsLoaded || status === 'loading') {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Protected guard={status === 'signedIn'}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
      <Stack.Screen name="index" />
    </Stack>
  );
}
