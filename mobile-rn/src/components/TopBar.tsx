import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/AuthProvider';
import { AceIcon } from '@/icons/AceIcon';
import { useTheme } from '@/theme/ThemeProvider';
import { Brand } from './Brand';

export const TOGGLE_ICON = { light: 'moon', dark: 'sun' } as const;

/** Theme switch (sun/moon), shared by the sign-in and app headers. */
export function ThemeToggle() {
  const { colors, mode, toggle } = useTheme();
  const label = mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={toggle} hitSlop={10} style={{ padding: 8 }}>
      <AceIcon name={TOGGLE_ICON[mode]} color={colors.content} size={22} />
    </Pressable>
  );
}

/** Header for the signed-in tabs: brand, theme switch, sign out. */
export function TopBar() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  return (
    <View style={{ paddingTop: insets.top + 8, paddingBottom: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background }}>
      <View style={{ flex: 1 }}>
        <Brand height={36} />
      </View>
      <ThemeToggle />
      <Pressable accessibilityRole="button" accessibilityLabel="Sign out" onPress={() => signOut()} hitSlop={10} style={{ padding: 8 }}>
        <AceIcon name="logout" color={colors.content} size={22} />
      </Pressable>
    </View>
  );
}
