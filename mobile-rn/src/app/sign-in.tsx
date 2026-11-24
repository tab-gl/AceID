import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/AuthProvider';
import { webUrl } from '@/auth/config';
import { errorMessage } from '@/api/errors';
import { Brand } from '@/components/Brand';
import { Panel, PrimaryButton, TextLink, Eyebrow, Text_, styles as ui } from '@/components/ui';
import { AceIcon } from '@/icons/AceIcon';
import { useTheme } from '@/theme/ThemeProvider';
import { ThemeToggle } from '@/components/TopBar';

export default function SignInScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSignIn = async () => {
    setBusy(true);
    setError(null);
    try {
      await signIn();
    } catch (cause) {
      setError(errorMessage(cause, 'Sign-in did not finish. Check your connection and try again.'));
    } finally {
      setBusy(false);
    }
  };

  const openLegal = (path: string) => {
    WebBrowser.openBrowserAsync(webUrl(path)).catch(() => undefined);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingHorizontal: 24, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Brand height={40} />
        <ThemeToggle />
      </View>

      <View style={{ height: 56 }} />

      <Text_ variant="displayLarge">{'Your identity,\nyour way.'}</Text_>
      <View style={{ height: 18 }} />
      <Text_ variant="bodyLarge" color={colors.muted}>
        One ID for the services you use. Sign in to manage your profile and security.
      </Text_>

      <View style={{ height: 30 }} />

      <Panel>
        <Eyebrow>Your ID</Eyebrow>
        <View style={{ height: 18 }} />
        <Feature icon="user" label="Profile and ID details" />
        <View style={{ height: 16 }} />
        <Feature icon="shield" label="Security and signed-in devices" />
      </Panel>

      <View style={{ height: 22 }} />

      <PrimaryButton
        label={busy ? 'Connecting securely' : 'Continue with Ace ID'}
        icon={busy ? undefined : 'login'}
        loading={busy}
        onPress={onSignIn}
      />

      {error ? (
        <View accessibilityLiveRegion="polite" style={[ui.panelBorder, { borderColor: colors.border, marginTop: 14, padding: 14 }]}>
          <Text_ variant="bodySmall">{error}</Text_>
        </View>
      ) : null}

      <View style={{ height: 34 }} />
      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />
      <View style={{ height: 12 }} />
      <Text_ variant="labelSmall" color={colors.muted}>{'ACE ID  ·  YOUR ID, IN ONE PLACE'}</Text_>
      <View style={{ height: 4, flexDirection: 'row' }}>
        <TextLink label="Privacy" onPress={() => openLegal('/privacy')} />
        <TextLink label="Terms" onPress={() => openLegal('/terms')} />
      </View>
    </ScrollView>
  );
}

function Feature({ icon, label }: { icon: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <AceIcon name={icon} color={colors.content} size={20} />
      <Text_ variant="bodyMedium">{label}</Text_>
    </View>
  );
}
