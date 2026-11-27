import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs, TabsList, TabsTrigger } from '@/components/tabs';
import { Icon, type IconName } from '@/icons/Icon';
import { springFor } from '@/design-system/tokens';
import { GlassBackdrop } from '@/design-system/glass/Backdrop';
import { haptic } from '@/ui/haptics';
import { HomeScreen } from '@/screens/HomeScreen';
import { SecurityScreen } from '@/screens/SecurityScreen';
import { ConnectedAppsScreen } from '@/screens/ConnectedAppsScreen';
import { IdScreen } from '@/screens/IdScreen';

export interface ScreenProps {
  /** True while this tab is the one on screen. */
  active: boolean;
  /** Switches to another tab by index (0 Home, 1 Security, 2 Apps, 3 ID). */
  openTab: (index: number) => void;
}

const TABS: { key: string; label: string; icon: IconName; Screen: React.ComponentType<ScreenProps> }[] = [
  { key: 'home', label: 'Home', icon: 'home', Screen: HomeScreen },
  { key: 'security', label: 'Security', icon: 'shield', Screen: SecurityScreen },
  { key: 'apps', label: 'Apps', icon: 'link', Screen: ConnectedAppsScreen },
  { key: 'id', label: 'ID', icon: 'user', Screen: IdScreen },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Where a swipe lands. `page` is the position at release; a fast flick projects
 * further (a quarter of the flick's distance per unit velocity), so short flicks
 * still change tab. Pure, so it is unit tested.
 */
export function swipeTarget(page: number, velocityX: number, width: number, count: number): number {
  if (width <= 0) return clamp(Math.round(page), 0, count - 1);
  const projected = page - (velocityX / width) * 0.25;
  return clamp(Math.round(projected), 0, count - 1);
}

const BAR_INSET = 14;

/**
 * The signed-in shell: four swipeable pages paired with beUI's animated pill
 * Tabs bar. Pages mount lazily on first visit.
 */
export function MainShell() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const page = useSharedValue(0);
  const dragStart = useSharedValue(0);
  const [active, setActive] = useState(0);
  const [visited, setVisited] = useState<number[]>([0]);

  const goTo = useCallback(
    (index: number) => {
      const target = clamp(index, 0, TABS.length - 1);
      setActive(target);
      setVisited((current) => (current.includes(target) ? current : [...current, target]));
      page.value = withSpring(target, springFor('default-spatial'));
    },
    [page],
  );

  // Android back returns to Home before leaving the app.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (active !== 0) {
        goTo(0);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [active, goTo]);

  const pageSwipe = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-12, 12])
        .failOffsetY([-16, 16])
        .onBegin(() => {
          dragStart.value = page.value;
        })
        .onUpdate((event) => {
          page.value = clamp(dragStart.value - event.translationX / width, -0.12, TABS.length - 0.88);
        })
        .onEnd((event) => {
          const target = swipeTarget(page.value, event.velocityX, width, TABS.length);
          page.value = withSpring(target, springFor('default-spatial'));
          runOnJS(goTo)(target);
        }),
    [width, page, dragStart, goTo],
  );

  const activeKey = TABS[active]?.key ?? 'home';

  return (
    <View style={styles.flex}>
      <GlassBackdrop />
      <GestureDetector gesture={pageSwipe}>
        <View style={styles.flex}>
          {TABS.map((tab, index) => (
            <PageSlot key={tab.key} index={index} page={page} width={width}>
              {visited.includes(index) ? <tab.Screen active={active === index} openTab={goTo} /> : null}
            </PageSlot>
          ))}
        </View>
      </GestureDetector>

      <View
        style={[
          styles.barWrap,
          {
            bottom: insets.bottom + 12,
            left: BAR_INSET + insets.left,
            right: BAR_INSET + insets.right,
          },
        ]}
      >
        <Tabs
          value={activeKey}
          variant="pill"
          icons="always"
          onValueChange={(nextKey) => {
            const idx = TABS.findIndex((t) => t.key === nextKey);
            if (idx >= 0) {
              haptic.select();
              goTo(idx);
            }
          }}
        >
          <TabsList className="w-full justify-between border border-border shadow-md">
            {TABS.map((tab, index) => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                icon={({ size, color }) => (
                  <Icon name={tab.icon} size={size} active={active === index} strokeWidth={1.6} color={String(color)} />
                )}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </View>
    </View>
  );
}

function PageSlot({
  index,
  page,
  width,
  children,
}: {
  index: number;
  page: SharedValue<number>;
  width: number;
  children: React.ReactNode;
}) {
  const style = useAnimatedStyle(() => {
    const distance = index - page.value;
    const magnitude = Math.abs(distance);
    return {
      transform: [
        { translateX: distance * width },
        { scale: interpolate(magnitude, [0, 1], [1, 0.965], Extrapolation.CLAMP) },
      ],
      opacity: interpolate(magnitude, [0, 1], [1, 0.4], Extrapolation.CLAMP),
      zIndex: magnitude < 0.5 ? 2 : 1,
    };
  });
  return <Animated.View style={[StyleSheet.absoluteFill, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  barWrap: {
    position: 'absolute',
    alignItems: 'center',
  },
});
