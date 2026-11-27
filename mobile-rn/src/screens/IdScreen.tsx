import React, { useRef, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useAuth } from '@/auth/AuthProvider';
import { fetchAccount, toProfile, type Profile } from '@/api/queries';
import { useLoader } from '@/api/useLoader';
import { Switch } from '@/components/switch';
import { webUrl, WEB } from '@/config';
import { useEnter } from '@/motion';
import { HAIRLINE, SHAPE, SPACE } from '@/design-system/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import type { ScreenProps } from '@/navigation/MainShell';
import { Icon } from '@/icons/Icon';
import { haptic } from '@/ui/haptics';
import { ActionRow, Avatar, Button, Card, ErrorState, Eyebrow, Rule, LoadingCard } from '@/ui/primitives';
import { PageScroll } from '@/ui/PageScroll';
import { ConfirmSheet } from '@/ui/Sheet';
import { useToast } from '@/ui/Toast';
import { AppText } from '@/ui/Text';
import { EditProfileSheet, type ProfileForm } from './EditProfileSheet';

export function IdScreen({ active }: ScreenProps) {
  const { colors, toggleMode, mode } = useTheme();
  const { api, profile: session, signOut } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [confirmOut, setConfirmOut] = useState(false);
  const loader = useLoader<Profile>(
    async () => toProfile(await fetchAccount(api), session?.name ?? '', session?.email ?? ''),
    'Could not load your ID.',
    active,
  );
  const profile = loader.data;
  const form: ProfileForm = {
    displayName: profile?.displayName ?? '',
    username: profile?.username ?? '',
    email: profile?.email ?? '',
    avatarUrl: profile?.avatarUrl ?? '',
  };
  const open = (path: string) =>
    Linking.openURL(webUrl(path)).catch(() => toast.show('Could not open the Ace ID site.', 'danger'));

  return (
    <>
      <EditProfileSheet
        visible={editing}
        initial={form}
        onDismiss={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          toast.show('Your ID was updated.', 'success');
          loader.reload();
        }}
        onError={(message) => toast.show(message, 'danger')}
      />
      <ConfirmSheet
        visible={confirmOut}
        title="Sign out of Ace ID?"
        message="This signs out of the app and revokes its tokens. Your ID stays intact."
        confirmLabel="Sign out"
        destructive
        onCancel={() => setConfirmOut(false)}
        onConfirm={() => {
          setConfirmOut(false);
          signOut();
        }}
      />
      <PageScroll
        eyebrow="Account"
        title="Your ID."
        subtitle="Personal details, appearance and account controls."
        refreshing={loader.refreshing}
        onRefresh={loader.reload}
      >
        {loader.error ? <ErrorState message={loader.error} onRetry={loader.reload} /> : null}

        {profile ? (
          <Card index={0} raised padding={SPACE.lg} style={styles.cardGap}>
            <View style={styles.identity}>
              <Avatar name={profile.displayName} url={profile.avatarUrl} size={68} />
              <View style={styles.identityText}>
                <AppText variant="title" numberOfLines={1}>
                  {profile.displayName}
                </AppText>
                <AppText variant="bodySmall" color={colors.muted} numberOfLines={1}>
                  {profile.username ? `@${profile.username}` : 'No username yet'}
                </AppText>
                <AppText variant="bodySmall" color={colors.muted} numberOfLines={1}>
                  {profile.email || 'No email'}
                </AppText>
              </View>
            </View>
            <Button label="Edit profile" icon="edit" variant="secondary" fullWidth disabled={loader.loading} onPress={() => setEditing(true)} />
          </Card>
        ) : (
          <LoadingCard lines={3} />
        )}

        <Eyebrow>Security, on the web</Eyebrow>
        <ActionRow index={1} icon="key" title="Password and sign-in" subtitle="Change password and recovery options" onPress={() => open(WEB.security)} />
        <ActionRow index={2} icon="monitor" title="Sessions and trusted devices" subtitle="Review and sign out devices" onPress={() => open(WEB.devices)} />
        <ActionRow index={3} icon="fingerprint" title="Passkeys and two-factor" subtitle="Manage stronger sign-in methods" onPress={() => open(WEB.security)} />
        <ActionRow index={4} icon="trash" title="Delete your ID" subtitle="Permanently remove your Ace ID" danger onPress={() => open(WEB.danger)} />

        <Eyebrow>Appearance</Eyebrow>
        <AppearanceRow index={5} dark={mode === 'dark'} onToggle={(origin) => toggleMode(origin)} />

        <Rule spacing={SPACE.sm} />
        <Button label="Sign out" icon="logout" variant="secondary" fullWidth onPress={() => setConfirmOut(true)} />
        <AppText variant="bodySmall" color={colors.muted} align="center">
          Sensitive security changes open in the secure Ace ID site and may ask you to sign in again.
        </AppText>
      </PageScroll>
    </>
  );
}

function AppearanceRow({ index, dark, onToggle }: { index: number; dark: boolean; onToggle: (origin: { x: number; y: number }) => void }) {
  const { colors } = useTheme();
  const enter = useEnter(index);
  const ref = useRef<React.ComponentRef<typeof View>>(null);

  const handleToggle = () => {
    haptic.select();
    ref.current?.measureInWindow((x, y, width, height) => onToggle({ x: x + width / 2, y: y + height / 2 }));
  };

  return (
    <Animated.View style={enter}>
      <Card padding={SPACE.md} style={styles.row}>
        <View ref={ref} collapsable={false} style={styles.measureAnchor} />
        <View style={[styles.tile, { borderColor: colors.border }]}>
          <Icon name={dark ? 'moon' : 'sun'} size={20} active color={colors.content} />
        </View>
        <View style={styles.flex}>
          <AppText variant="titleMedium">Dark appearance</AppText>
          <AppText variant="bodySmall" color={colors.muted}>
            {dark ? 'Dark palette, ink on paper inverted' : 'Light palette, ink on paper'}
          </AppText>
        </View>
        <Switch checked={dark} onCheckedChange={handleToggle} accessibilityLabel="Dark appearance" />
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  cardGap: { gap: SPACE.lg },
  measureAnchor: { position: 'absolute', top: '50%', right: 40, width: 4, height: 4 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md },
  identityText: { flex: 1, gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md },
  tile: { width: 40, height: 40, borderWidth: HAIRLINE, borderRadius: SHAPE.medium, alignItems: 'center', justifyContent: 'center' },
});
