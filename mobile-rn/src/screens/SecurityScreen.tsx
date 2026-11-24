import React from 'react';
import { Linking, View } from 'react-native';
import { useAuth } from '@/auth/AuthProvider';
import { webUrl, WEB } from '@/config';
import { fetchSecurity, type Device } from '@/api/queries';
import { shortDate } from '@/api/json';
import { useLoader } from '@/api/useLoader';
import { SPACE } from '@/design-system/tokens';
import type { ScreenProps } from '@/navigation/MainShell';
import { DataRow } from '@/ui/DataRow';
import { Button, EmptyState, ErrorState, SectionHeader, LoadingCard } from '@/ui/primitives';
import { PageScroll } from '@/ui/PageScroll';
import { useToast } from '@/ui/Toast';

export function SecurityScreen({ active }: ScreenProps) {
  const { api } = useAuth();
  const toast = useToast();
  const loader = useLoader(() => fetchSecurity(api), 'Could not load your security activity.', active);
  const data = loader.data;
  const error = loader.error ?? data?.partialError ?? null;

  return (
    <PageScroll
      eyebrow="Security"
      title="Devices and activity."
      subtitle="Where your ID is signed in, and what has happened recently."
      refreshing={loader.refreshing}
      onRefresh={loader.reload}
    >
      {loader.error ? <ErrorState message={loader.error} onRetry={loader.reload} /> : null}
      {!loader.error && data?.partialError ? <ErrorState message={data.partialError} onRetry={loader.reload} /> : null}

      <SectionHeader title="Signed-in devices" count={data ? data.devices.length : null} />
      {!data && loader.loading ? <LoadingCard lines={2} /> : null}
      {data && data.devices.length === 0 && !error ? (
        <EmptyState icon="monitor" title="No device details yet" message="Sessions appear here once your ID is used on a device." />
      ) : null}
      {data?.devices.map((device: Device, index: number) => (
        <DataRow
          key={device.id}
          index={index}
          icon={/ios|android|phone|mobile/i.test(`${device.os} ${device.name}`) ? 'smartphone' : 'monitor'}
          title={device.name}
          subtitle={`${device.os} · ${device.location}`}
          trailing={shortDate(device.lastSeen)}
        />
      ))}

      <SectionHeader title="Recent activity" count={data ? data.activity.length : null} />
      {!data && loader.loading ? <LoadingCard lines={3} /> : null}
      {data && data.activity.length === 0 && !error ? (
        <EmptyState icon="history" title="Nothing recent" message="Sign-ins and security events will show up here." />
      ) : null}
      {data?.activity.slice(0, 12).map((entry, index) => (
        <DataRow
          key={entry.id}
          index={index}
          icon="history"
          title={entry.title}
          subtitle={`${entry.category} · ${entry.browser}`}
          trailing={shortDate(entry.createdAt)}
        />
      ))}

      <View style={{ marginTop: SPACE.sm }}>
        <Button
          label="Open security settings"
          variant="secondary"
          icon="external"
          fullWidth
          onPress={() => Linking.openURL(webUrl(WEB.security)).catch(() => toast.show('Could not open the Ace ID site.', 'danger'))}
        />
      </View>
    </PageScroll>
  );
}
