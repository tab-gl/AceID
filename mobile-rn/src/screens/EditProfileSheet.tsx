import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/api/errors';
import { saveProfile } from '@/api/queries';
import type { JsonObject } from '@/api/json';
import { SPACE } from '@/theme/tokens';
import { Button } from '@/ui/primitives';
import { Sheet } from '@/ui/Sheet';
import { TextField } from '@/ui/TextField';

export interface ProfileForm {
  displayName: string;
  username: string;
  email: string;
  avatarUrl: string;
}

/** Edits the profile. Only changed fields are sent, so username and email are never resent. */
export function EditProfileSheet({
  visible,
  initial,
  onDismiss,
  onSaved,
  onError,
}: {
  visible: boolean;
  initial: ProfileForm;
  onDismiss: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
}) {
  const { api } = useAuth();
  const [form, setForm] = useState<ProfileForm>(initial);
  const [saving, setSaving] = useState(false);

  // Reset from the latest loaded values each time the sheet opens.
  useEffect(() => {
    if (visible) setForm(initial);
    // Only re-seed when the sheet opens or the source values change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initial.displayName, initial.username, initial.email, initial.avatarUrl]);

  const changes = (): JsonObject => {
    const values: JsonObject = {};
    if (form.displayName.trim() !== initial.displayName.trim()) values.display_name = form.displayName.trim();
    if (form.username.trim() !== initial.username.trim()) values.username = form.username.trim();
    if (form.email.trim() !== initial.email.trim()) values.email = form.email.trim();
    if (form.avatarUrl.trim() !== initial.avatarUrl.trim()) values.avatar_url = form.avatarUrl.trim();
    return values;
  };
  const pending = Object.keys(changes()).length > 0;

  const save = async () => {
    const values = changes();
    if (Object.keys(values).length === 0) return;
    setSaving(true);
    try {
      await saveProfile(api, values);
      onSaved();
    } catch (cause) {
      onError(errorMessage(cause, 'Could not save your changes.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet visible={visible} onDismiss={onDismiss} title="Edit your ID">
      <View style={{ gap: SPACE.lg, paddingBottom: SPACE.sm }}>
        <TextField label="Display name" value={form.displayName} onChangeText={(v) => setForm({ ...form, displayName: v })} autoComplete="name" />
        <TextField
          label="Username"
          value={form.username}
          onChangeText={(v) => setForm({ ...form, username: v })}
          prefix="@"
          autoCapitalize="none"
          autoComplete="username"
        />
        <TextField
          label="Email"
          value={form.email}
          onChangeText={(v) => setForm({ ...form, email: v })}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <TextField
          label="Avatar URL"
          value={form.avatarUrl}
          onChangeText={(v) => setForm({ ...form, avatarUrl: v })}
          keyboardType="url"
          autoCapitalize="none"
          placeholder="https://"
        />
        <Button label={pending ? 'Save changes' : 'Nothing to save'} disabled={!pending} loading={saving} fullWidth onPress={save} />
      </View>
    </Sheet>
  );
}
