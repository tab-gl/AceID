import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useEnter } from '@/motion';
import { HAIRLINE, SHAPE, SPACE } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon, type IconName } from '@/icons/Icon';
import { AppText } from './Text';
import { Card } from './primitives';

/** A read-only record: icon, title, supporting line and an optional trailing value. */
export function DataRow({
  icon,
  title,
  subtitle,
  trailing,
  index = 0,
  tone = 'neutral',
  children,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  trailing?: string | null;
  index?: number;
  tone?: 'neutral' | 'danger';
  children?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const enter = useEnter(index);
  const accent = tone === 'danger' ? colors.danger : colors.content;
  return (
    <Animated.View style={enter}>
      <Card padding={SPACE.md} style={styles.card}>
        <View style={styles.top}>
          <View style={[styles.tile, { borderColor: colors.border }]}>
            <Icon name={icon} size={20} color={accent} />
          </View>
          <View style={styles.text}>
            <AppText variant="titleMedium" color={accent} numberOfLines={2}>
              {title}
            </AppText>
            {subtitle ? (
              <AppText variant="bodySmall" color={colors.muted} numberOfLines={2}>
                {subtitle}
              </AppText>
            ) : null}
          </View>
          {trailing ? (
            <AppText variant="bodySmall" color={colors.muted} style={styles.trailing}>
              {trailing}
            </AppText>
          ) : null}
        </View>
        {children ? <View style={styles.extra}>{children}</View> : null}
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: SHAPE.extraSmall },
  top: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md },
  tile: { width: 40, height: 40, borderWidth: HAIRLINE, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  trailing: { maxWidth: 110, textAlign: 'right' },
  extra: { marginTop: SPACE.md, gap: SPACE.sm },
});
