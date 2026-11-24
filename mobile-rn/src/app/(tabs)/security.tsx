import React from 'react';
import { ErrorPanel, DataTile, EmptyPanel, OutlineButton, Page, SectionHeading, Text_, Spinner } from '@/components/ui';
import { useAuth } from '@/auth/AuthProvider';
import { activityLogs, firstText, objects, shortDate, type JsonObject } from '@/api/json';
import { errorMessage } from '@/api/errors';
import { useLoader } from '@/api/useLoader';
import { useTheme } from '@/theme/ThemeProvider';
import { View } from 'react-native';
import { WEB, useOpenWeb } from '@/auth/web';

interface SecurityData {
  devices: JsonObject[];
  logs: JsonObject[];
  /** Set when one of the two requests failed but the other succeeded. */
  partialError: string | null;
}

export default function SecurityScreen() {
  const { colors } = useTheme();
  const { api } = useAuth();
  const openWeb = useOpenWeb();
  const loader = useLoader<SecurityData>(async () => {
    // Fetch in parallel so one slow endpoint does not block the other, and
    // keep whichever half succeeded.
    const [devices, logs] = await Promise.allSettled([
      api.request('/api/account/devices'),
      api.request('/api/account/logs'),
    ]);
    if (devices.status === 'rejected' && logs.status === 'rejected') throw devices.reason;
    const partialError =
      devices.status === 'rejected'
        ? errorMessage(devices.reason, 'Could not load signed-in devices.')
        : logs.status === 'rejected'
          ? errorMessage(logs.reason, 'Could not load recent activity.')
          : null;
    return {
      devices: devices.status === 'fulfilled' ? objects(devices.value, 'devices') : [],
      logs: logs.status === 'fulfilled' ? activityLogs(logs.value) : [],
      partialError,
    };
  }, 'Could not load your security activity.');

  const data = loader.data;
  const devices = data?.devices ?? [];
  const logs = data?.logs ?? [];
  const error = loader.error ?? data?.partialError ?? null;

  return (
    <Page refreshing={loader.refreshing} onRefresh={loader.reload}>
      <Text_ variant="displayMedium">Security</Text_>
      <Text_ variant="bodyLarge" color={colors.muted}>Your recent sessions and ID activity.</Text_>

      {error ? <ErrorPanel message={error} onRetry={loader.reload} /> : null}

      <View style={{ height: 8 }} />
      <SectionHeading title="Signed-in devices" count={devices.length} />
      {loader.loading && !data ? <Spinner /> : null}
      {!loader.loading && data && devices.length === 0 && !error ? <EmptyPanel message="No session details were returned." /> : null}
      {devices.map((device, index) => (
        <DataTile
          key={firstText(device, ['id', 'session_id'], String(index))}
          icon="computer"
          title={firstText(device, ['device_name', 'browser', 'device_type'], 'Signed-in device')}
          subtitle={firstText(device, ['os'], 'Device') + ' · ' + firstText(device, ['location'], 'Location unavailable')}
          trailing={shortDate(firstText(device, ['last_seen_at', 'created_at']))}
        />
      ))}

      <View style={{ height: 10 }} />
      <SectionHeading title="Recent activity" count={logs.length} />
      {!loader.loading && data && logs.length === 0 && !error ? <EmptyPanel message="No recent activity was returned." /> : null}
      {logs.slice(0, 12).map((entry, index) => (
        <DataTile
          key={firstText(entry, ['id'], String(index))}
          icon="history"
          title={firstText(entry, ['name', 'event_type'], 'ID activity')}
          subtitle={firstText(entry, ['category'], 'id') + ' · ' + firstText(entry, ['browser'], 'Ace ID')}
          trailing={shortDate(firstText(entry, ['created_at']))}
        />
      ))}

      <View style={{ height: 14 }} />
      <OutlineButton label="More security settings" icon="open" onPress={() => openWeb(WEB.security)} />
    </Page>
  );
}
