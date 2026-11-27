import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useAuth } from '@/auth/AuthProvider';
import { useLoader } from '@/api/useLoader';
import { fetchAccount, fetchConnectedApps, fetchSecurity, toProfile, type Profile } from '@/api/queries';
import { AnimatedBadge } from '@/components/animated-badge';
import { Loader } from '@/components/loader';
import { NumberTicker } from '@/components/number';
import { SPACE } from '@/design-system/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import type { ScreenProps } from '@/navigation/MainShell';
import { ActionRow, Avatar, Card, ErrorState, Eyebrow, LoadingCard } from '@/ui/primitives';
import { PageScroll } from '@/ui/PageScroll';
import { AppText } from '@/ui/Text';

interface HomeData {
  profile: Profile;
  verifiedEmail: boolean;
  devices: number | null;
  activity: number | null;
  apps: number | null;
}

export function HomeScreen({ active, openTab }: ScreenProps) {
  const { colors } = useTheme();
  const { api, profile: session } = useAuth();
  const loader = useLoader<HomeData>(
    async () => {
      const [account, security, apps] = await Promise.allSettled([
        fetchAccount(api),
        fetchSecurity(api),
        fetchConnectedApps(api),
      ]);
      if (account.status === 'rejected') throw account.reason;
      const data = account.value;
      return {
        profile: toProfile(data, session?.name ?? '', session?.email ?? ''),
        verifiedEmail: data.email_verified !== false,
        devices: security.status === 'fulfilled' ? security.value.devices.length : null,
        activity: security.status === 'fulfilled' ? security.value.activity.length : null,
        apps: apps.status === 'fulfilled' ? apps.value.length : null,
      };
    },
    'Could not load your ID.',
    active,
  );

  const data = loader.data;
  const firstName = (data?.profile.displayName ?? session?.name ?? 'there').split(' ')[0];

  return (
    <PageScroll
      eyebrow="Your ID"
      title={data ? `Good to have you, ${firstName}.` : 'Good to have you here.'}
      subtitle="Your identity, sessions and access, all in one place."
      refreshing={loader.refreshing}
      onRefresh={loader.reload}
    >
      {loader.error ? <ErrorState message={loader.error} onRetry={loader.reload} /> : null}

      {data ? (
        <Card index={0} raised padding={SPACE.lg}>
          <View style={styles.identity}>
            <Avatar name={data.profile.displayName} url={data.profile.avatarUrl} size={60} />
            <View style={styles.identityText}>
              <AppText variant="title" numberOfLines={1}>
                {data.profile.displayName}
              </AppText>
              <AppText variant="bodySmall" color={colors.muted} numberOfLines={1}>
                {data.profile.email || 'No email on this ID'}
              </AppText>
              <View style={styles.badges}>
                {data.profile.username ? (
                  <AnimatedBadge size="sm" status="neutral" showIcon={false}>
                    {`@${data.profile.username}`}
                  </AnimatedBadge>
                ) : null}
                <AnimatedBadge size="sm" status={data.verifiedEmail ? 'success' : 'danger'}>
                  {data.verifiedEmail ? 'Email verified' : 'Email not verified'}
                </AnimatedBadge>
              </View>
            </View>
          </View>
        </Card>
      ) : (
        <LoadingCard height={132} />
      )}

      <View style={styles.stats}>
        <Stat index={1} label="Devices" value={data?.devices ?? null} loading={!data} />
        <Stat index={2} label="Apps" value={data?.apps ?? null} loading={!data} />
        <Stat index={3} label="Events" value={data?.activity ?? null} loading={!data} />
      </View>

      <Eyebrow>Manage</Eyebrow>
      <ActionRow index={4} icon="shield" title="Security and devices" subtitle="Sessions and recent sign-in activity" onPress={() => openTab(1)} />
      <ActionRow index={5} icon="link" title="Connected apps" subtitle="See and revoke app access" onPress={() => openTab(2)} />
      <ActionRow index={6} icon="user" title="Your ID" subtitle="Profile, appearance and account" onPress={() => openTab(3)} />

      <AppText variant="bodySmall" color={colors.muted} align="center" style={styles.hint}>
        Pull down to refresh.
      </AppText>
    </PageScroll>
  );
}

function Stat({ index, label, value, loading }: { index: number; label: string; value: number | null; loading: boolean }) {
  return (
    <Card index={index} padding={SPACE.md} style={styles.stat}>
      <Eyebrow>{label}</Eyebrow>
      {loading || value === null ? (
        <Loader variant="dots" size={22} label={`Loading ${label}`} />
      ) : (
        <NumberTicker value={value} className="text-4xl font-semibold text-foreground" />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md },
  identityText: { flex: 1, gap: 3 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.xs, marginTop: SPACE.xs },
  stats: { flexDirection: 'row', gap: SPACE.sm },
  stat: { flex: 1, gap: SPACE.xs, minHeight: 92, justifyContent: 'space-between' },
  hint: { marginTop: SPACE.sm },
});
