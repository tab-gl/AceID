import React, { useState } from 'react';
import { View } from 'react-native';
import { useAuth } from '@/auth/AuthProvider';
import { firstText, objects, strings, type JsonObject } from '@/api/json';
import { ConfirmDialog, useToast } from '@/components/Overlays';
import { useLoader } from '@/api/useLoader';
import { errorMessage } from '@/api/errors';
import { DataTile, EmptyPanel, ErrorPanel, OutlineButton, Page, Panel, Text_ } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';

export default function ConnectedAppsScreen() {
  const { colors } = useTheme();
  const { api } = useAuth();
  const toast = useToast();
  const [pending, setPending] = useState<JsonObject | null>(null);
  const [revoking, setRevoking] = useState(false);

  const loader = useLoader<JsonObject[]>(
    async () => objects(await api.request('/api/account/connected-apps'), 'connectedApps'),
    'Could not load connected apps.',
  );
  const apps = loader.data ?? [];

  const revoke = async (app: JsonObject) => {
    const grantId = firstText(app, ['grantId']);
    if (!grantId) {
      toast.show('That app did not report a grant ID.');
      return;
    }
    if (revoking) return;
    setRevoking(true);
    try {
      await api.request(`/api/account/connected-apps/${encodeURIComponent(grantId)}`, { method: 'DELETE' });
      toast.show('App disconnected.');
      loader.reload();
    } catch (cause) {
      toast.show(errorMessage(cause, 'Could not disconnect that app.'));
    } finally {
      setRevoking(false);
    }
  };

  const clientName = firstText(pending, ['clientName'], 'This app');

  return (
    <>
      <ConfirmDialog
        visible={pending !== null}
        title="Disconnect this app?"
        message={`${clientName} will no longer be able to use this authorization.`}
        confirmLabel="Disconnect"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          const target = pending;
          setPending(null);
          if (target) revoke(target);
        }}
      />
      <Page refreshing={loader.refreshing} onRefresh={loader.reload}>
        <Text_ variant="displayMedium">Connected apps</Text_>
        <Text_ variant="bodyLarge" color={colors.muted}>Control which services can access your Ace ID.</Text_>

        {loader.error ? <ErrorPanel message={loader.error} onRetry={loader.reload} /> : null}

        {!loader.loading && loader.data && apps.length === 0 && !loader.error ? (
          <EmptyPanel message="No connected apps yet. When a service uses Ace ID, it will appear here." />
        ) : null}

        {apps.map((app, index) => {
          const scopes = strings(app, 'scopes');
          return (
            <Panel key={firstText(app, ['grantId', 'clientId'], String(index))} style={{ padding: 16, gap: 12 }}>
              <DataTile
                icon="grid"
                title={firstText(app, ['clientName'], 'Connected app')}
                subtitle={firstText(app, ['clientUri', 'clientId'])}
              />
              <Text_ variant="bodySmall">
                {scopes.length === 0 ? 'Access: openid' : 'Access: ' + scopes.join(', ')}
              </Text_>
              <View style={{ alignItems: 'flex-end' }}>
                <OutlineButton
                  label="Disconnect"
                  icon="link-off"
                  disabled={revoking}
                  onPress={() => setPending(app)}
                />
              </View>
            </Panel>
          );
        })}
      </Page>
    </>
  );
}
