import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/api/errors';
import { fetchConnectedApps, revokeConnectedApp, type ConnectedApp } from '@/api/queries';
import { useLoader } from '@/api/useLoader';
import { SPACE } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import type { ScreenProps } from '@/navigation/MainShell';
import { AppText } from '@/ui/Text';
import { Card, Button, EmptyState, ErrorState, SkeletonCard } from '@/ui/primitives';
import { PageScroll } from '@/ui/PageScroll';
import { ConfirmSheet } from '@/ui/Sheet';
import { useToast } from '@/ui/Toast';

export function ConnectedAppsScreen({ active }: ScreenProps) {
  const { colors } = useTheme();
  const { api } = useAuth();
  const toast = useToast();
  const [pending, setPending] = useState<ConnectedApp | null>(null);
  const [revoking, setRevoking] = useState(false);
  const loader = useLoader(() => fetchConnectedApps(api), 'Could not load connected apps.', active);
  const apps = loader.data ?? [];

  const revoke = async (app: ConnectedApp) => {
    if (!app.grantId) {
      toast.show('That app did not report a grant ID.', 'danger');
      return;
    }
    setRevoking(true);
    try {
      await revokeConnectedApp(api, app.grantId);
      toast.show(`${app.name} disconnected.`, 'success');
      loader.reload();
    } catch (cause) {
      toast.show(errorMessage(cause, 'Could not disconnect that app.'), 'danger');
    } finally {
      setRevoking(false);
    }
  };

  return (
    <>
      <ConfirmSheet
        visible={pending !== null}
        title="Disconnect this app?"
        message={`${pending?.name ?? 'This app'} will no longer be able to use this authorization. You can connect it again later.`}
        confirmLabel="Disconnect"
        destructive
        onCancel={() => setPending(null)}
        onConfirm={() => {
          const target = pending;
          setPending(null);
          if (target) revoke(target);
        }}
      />
      <PageScroll
        eyebrow="Access"
        title="Connected apps."
        subtitle="Services that can use your Ace ID. Disconnect any you no longer trust."
        refreshing={loader.refreshing}
        onRefresh={loader.reload}
      >
        {loader.error ? <ErrorState message={loader.error} onRetry={loader.reload} /> : null}
        {!loader.data && loader.loading ? <SkeletonCard lines={2} /> : null}
        {loader.data && apps.length === 0 && !loader.error ? (
          <EmptyState icon="link" title="No connected apps" message="When a service uses Ace ID, it appears here." />
        ) : null}
        {apps.map((app, index) => (
          <Card key={`${app.grantId}-${app.clientId}`} index={index} padding={SPACE.md} style={{ gap: SPACE.sm }}>
            <View style={styles.gap}>
              <AppText variant="title" numberOfLines={1}>
                {app.name}
              </AppText>
              <AppText variant="bodySmall" color={colors.muted} numberOfLines={1}>
                {app.clientUri || app.clientId}
              </AppText>
            </View>
            <AppText variant="bodySmall" color={colors.muted}>
              {app.scopes.length === 0 ? 'Access: openid' : `Access: ${app.scopes.join(', ')}`}
            </AppText>
            <View style={styles.start}>
              <Button label="Disconnect" icon="unlink" variant="danger" disabled={revoking} onPress={() => setPending(app)} />
            </View>
          </Card>
        ))}
      </PageScroll>
    </>
  );
}

const styles = StyleSheet.create({
  gap: { gap: 2 },
  start: { alignItems: 'flex-start' },
});
