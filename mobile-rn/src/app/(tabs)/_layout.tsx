import { Tabs } from 'expo-router';
import React from 'react';
import { FloatingTabBar } from '@/components/FloatingTabBar';
import { TopBar } from '@/components/TopBar';
import { useTheme } from '@/theme/ThemeProvider';

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        header: () => <TopBar />,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="security" />
      <Tabs.Screen name="connected" />
      <Tabs.Screen name="id" />
    </Tabs>
  );
}
