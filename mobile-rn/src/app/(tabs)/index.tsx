import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useAuth } from '@/auth/AuthProvider';
import { firstText, type JsonObject } from '@/api/json';
import { ActionTile, Avatar, Eyebrow, ErrorPanel, InfoRow, Page, Panel, PrimaryButton, Text_ } from '@/components/ui';
import { AceIcon } from '@/icons/AceIcon';
import { useLoader } from '@/api/useLoader';
import { useTheme } from '@/theme/ThemeProvider';

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { api, profile } = useAuth();
  const loader = useLoader<JsonObject>(() => api.request('/api/account'), 'Could not load your ID.');
  const account = loader.data;

  const name = firstText(account, ['display_name'], profile?.name || 'Ace ID member');
  const email = firstText(account, ['email'], profile?.email ?? '');
  const username = firstText(account, ['username']);
  const verified = account ? account.email_verified !== false : true;

  return (
    <Page refreshing={loader.refreshing} onRefresh={loader.reload}>
      <Eyebrow>Your ID</Eyebrow>
      <Text_ variant="displayMedium">Good to have you here.</Text_>
      <Text_ variant="bodyLarge" color={colors.muted}>Your identity, all in one place.</Text_>

      {loader.error ? <ErrorPanel message={loader.error} onRetry={loader.reload} /> : null}

      <Panel>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Avatar letter={(name.trim()[0] ?? 'A').toUpperCase()} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text_ variant="titleLarge">{name}</Text_>
            <Text_ variant="bodySmall" color={colors.muted}>{email}</Text_>
            {!verified ? <Text_ variant="labelSmall">Email not verified</Text_> : null}
          </View>
          <AceIcon name={verified ? 'shield-check' : 'shield'} color={colors.content} size={22} />
        </View>
        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 14 }} />
        <InfoRow label="Username" value={'@' + (username || '…')} />
        <View style={{ height: 16 }} />
        <PrimaryButton label="Manage ID" icon="user" onPress={() => router.navigate('/id')} />
      </Panel>

      <ActionTile icon="shield" title="Security & devices" subtitle="Review sessions and ID protection" onPress={() => router.navigate('/security')} />
      <ActionTile icon="link" title="Connected apps" subtitle="Review and revoke app access" onPress={() => router.navigate('/connected')} />

      <Text_ variant="bodySmall" color={colors.muted}>Pull down to refresh your ID details.</Text_>
    </Page>
  );
}
