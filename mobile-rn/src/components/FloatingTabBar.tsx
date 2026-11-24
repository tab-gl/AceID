import type { Tabs } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { AceIcon } from '@/icons/AceIcon';
import { SHAPE, TYPE, springFor } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

/** Props the Tabs navigator passes to a custom tabBar, derived from the public API. */
type BottomTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

const TAB_ICONS: Record<string, string> = {
  index: 'home',
  security: 'shield',
  connected: 'link',
  id: 'user',
};

const TAB_LABELS: Record<string, string> = {
  index: 'Home',
  security: 'Security',
  connected: 'Connected',
  id: 'ID',
};

/** The floating bottom navigation bar: the one rounded surface in the design. */
export function FloatingTabBar({ state, emitter, navigateToTab, insets: tabInsets }: BottomTabBarProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const count = state.routes.length;
  const cell = count > 0 ? (width - 12) / count : 0;
  const indicatorX = useSharedValue(0);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: cell,
  }));

  const select = (index: number) => {
    // Reanimated shared values are written from event handlers by design.
    // eslint-disable-next-line react-hooks/immutability
    indicatorX.value = withSpring(index * cell, springFor('default-spatial'));
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(tabInsets.bottom, 10) }]}
    >
      <View
        onLayout={(event) => {
          const next = event.nativeEvent.layout.width;
          setWidth(next);
          // eslint-disable-next-line react-hooks/immutability
          indicatorX.value = state.index * ((next - 12) / count);
        }}
        accessibilityRole="tablist"
        style={[styles.bar, { backgroundColor: colors.panel, borderColor: colors.border }]}
      >
        {cell > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.indicator, { backgroundColor: colors.content }, indicatorStyle]}
          />
        ) : null}
        {state.routes.map((route, index) => {
          const active = state.index === index;
          const label = TAB_LABELS[route.name] ?? route.name;
          const iconColor = active ? colors.background : colors.muted;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: active }}
              onPress={() => {
                if (!active) select(index);
                const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!active && !event.defaultPrevented) navigateToTab(route.key);
              }}
              style={styles.item}
            >
              <AceIcon name={TAB_ICONS[route.name] ?? 'grid'} color={iconColor} size={19} />
              <Text style={[TYPE.labelSmall, { color: iconColor, marginTop: 4 }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 10 },
  bar: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: SHAPE.extraLarge,
    padding: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  indicator: { position: 'absolute', top: 6, bottom: 6, left: 6, borderRadius: 22 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, zIndex: 1 },
});
