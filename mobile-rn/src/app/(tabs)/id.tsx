import React, { useState } from 'react';
import { View } from 'react-native';
import { useAuth } from '@/auth/AuthProvider';
import { firstText, type JsonObject } from '@/api/json';
import { errorMessage } from '@/api/errors';
import { Avatar, ActionTile, ErrorPanel, LabeledField, OutlineButton, Page, PrimaryButton, Panel, Text_ } from '@/components/ui';
import { Sheet, useToast } from '@/components/Overlays';
import { useLoader } from '@/api/useLoader';
import { WEB, useOpenWeb } from '@/auth/web';
import { useTheme } from '@/theme/ThemeProvider';

export default function IdScreen() {
  const { colors } = useTheme();
  const { api, profile, signOut } = useAuth();
  const toast = useToast();
  const openWeb = useOpenWeb();
  const [editing, setEditing] = useState(false);

  const loader = useLoader<JsonObject>(() => api.request('/api/account'), 'Could not load your ID.');
  const account = loader.data;
  const displayName = firstText(account, ['display_name'], profile?.name || 'Ace ID member');
  const email = firstText(account, ['email'], profile?.email ?? '');
  const username = firstText(account, ['username']);

  return (
    <>
      <EditProfile
        visible={editing}
        account={account}
        fallbackName={profile?.name ?? ''}
        fallbackEmail={profile?.email ?? ''}
        onDismiss={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          toast.show('Your ID was updated.');
          loader.reload();
        }}
        onError={(message) => toast.show(message)}
      />
      <Page refreshing={loader.refreshing} onRefresh={loader.reload}>
        <Text_ variant="displayMedium">Your ID</Text_>
        <Text_ variant="bodyLarge" color={colors.muted}>Personal details and preferences.</Text_>

        {loader.error ? <ErrorPanel message={loader.error} onRetry={loader.reload} /> : null}

        <View style={{ height: 8 }} />
        <Panel>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Avatar letter={(displayName.trim()[0] ?? 'A').toUpperCase()} size={60} large />
            <View style={{ flex: 1, gap: 2 }}>
              <Text_ variant="titleLarge">{displayName}</Text_>
              <Text_ variant="bodySmall" color={colors.muted}>{email}</Text_>
              <Text_ variant="bodySmall">{'@' + (username || '…')}</Text_>
            </View>
          </View>
          <View style={{ height: 18 }} />
          <OutlineButton label="Edit profile" icon="edit" disabled={loader.loading} onPress={() => setEditing(true)} />
        </Panel>

        <ActionTile icon="key" title="Password & sign-in" subtitle="Change password and recovery options" onPress={() => openWeb(WEB.security)} />
        <ActionTile icon="computer" title="Sessions & trusted devices" subtitle="Review and sign out devices" onPress={() => openWeb(WEB.devices)} />
        <ActionTile icon="fingerprint" title="Passkeys & two-factor authentication" subtitle="Manage stronger sign-in methods" onPress={() => openWeb(WEB.security)} />
        <ActionTile icon="delete" title="Delete your ID" subtitle="Permanently remove your Ace ID" danger onPress={() => openWeb(WEB.danger)} />

        <View style={{ height: 10 }} />
        <OutlineButton label="Sign out" icon="logout" onPress={() => signOut()} />

        <Text_ variant="bodySmall" color={colors.muted}>
          Sensitive security changes open in the secure Ace ID site and may require you to sign in again.
        </Text_>
      </Page>
    </>
  );
}

function EditProfile({ visible, account, fallbackName, fallbackEmail, onDismiss, onSaved, onError }: {
  visible: boolean;
  account: JsonObject | null;
  fallbackName: string;
  fallbackEmail: string;
  onDismiss: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
}) {
  const { api } = useAuth();
  const originalName = firstText(account, ['display_name'], fallbackName);
  const originalUsername = firstText(account, ['username']);
  const originalEmail = firstText(account, ['email'], fallbackEmail);
  const originalAvatar = firstText(account, ['avatar_url']);

  const [name, setName] = useState(originalName);
  const [username, setUsername] = useState(originalUsername);
  const [email, setEmail] = useState(originalEmail);
  const [avatar, setAvatar] = useState(originalAvatar);
  const [saving, setSaving] = useState(false);

  // Reset the form each time the sheet opens, from the latest loaded values.
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  const key = visible ? `${originalName}|${originalUsername}|${originalEmail}|${originalAvatar}` : null;
  if (visible && key !== openedFor) {
    setOpenedFor(key);
    setName(originalName);
    setUsername(originalUsername);
    setEmail(originalEmail);
    setAvatar(originalAvatar);
  }

  const changed = name.trim() !== originalName.trim() || username.trim() !== originalUsername.trim() ||
    email.trim() !== originalEmail.trim() || avatar.trim() !== originalAvatar.trim();

  const save = async () => {
    // Only send fields that actually changed, so username and email are never resent unnecessarily.
    const values: JsonObject = {};
    if (name.trim() !== originalName.trim()) values.display_name = name.trim();
    if (username.trim() !== originalUsername.trim()) values.username = username.trim();
    if (email.trim() !== originalEmail.trim()) values.email = email.trim();
    if (avatar.trim() !== originalAvatar.trim()) values.avatar_url = avatar.trim();
    setSaving(true);
    try {
      await api.request('/api/account', { method: 'POST', body: values });
      onSaved();
    } catch (cause) {
      onError(errorMessage(cause, 'Could not save your changes.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet visible={visible} onDismiss={onDismiss} title="Edit your ID">
      <View style={{ gap: 14, paddingBottom: 8 }}>
        <LabeledField label="Display name" value={name} onChangeText={setName} />
        <LabeledField label="Username" value={username} onChangeText={setUsername} prefix="@" autoCapitalize="none" />
        <LabeledField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <LabeledField label="Avatar URL" value={avatar} onChangeText={setAvatar} keyboardType="url" autoCapitalize="none" />
        <View style={{ height: 6 }} />
        <PrimaryButton label="Save changes" disabled={!changed} loading={saving} onPress={save} />
      </View>
    </Sheet>
  );
}
