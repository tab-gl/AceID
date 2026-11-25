import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, LayoutChangeEvent, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
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
import { Icon, type IconName } from '@/icons/Icon';
import { springFor, SHAPE, FONT } from '@/design-system/tokens';
import { GlassSurface } from '@/design-system/glass';
import { GlassBackdrop } from '@/design-system/glass/Backdrop';
import { GLASS } from '@/design-system/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { haptic } from '@/ui/haptics';
import { AppText } from '@/ui/Text';
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
const BAR_HEIGHT = 64;
const PILL_PADDING = 5;

/**
 * The signed-in shell: four pages side by side that follow the finger, a
 * sliding pill indicator, and a floating tab bar. Pages mount on first visit.
 */
export function MainShell() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const page = useSharedValue(0);
  const dragStart = useSharedValue(0);
  const [active, setActive] = useState(0);
  const [visited, setVisited] = useState<number[]>([0]);
  const [barWidth, setBarWidth] = useState(0);

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

  // One swipe recogniser, attached to the pages and to the tab bar. Horizontal
  // drags only, so vertical scrolling inside a page is not affected.
  const [pageSwipe, barSwipe] = useMemo(() => {
    const build = () =>
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
        });
    return [build(), build()];
  }, [width, page, dragStart, goTo]);

  const itemWidth = barWidth > 0 ? (barWidth - PILL_PADDING * 2) / TABS.length : 0;
  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: page.value * itemWidth }],
    width: itemWidth,
  }));

  return (
    <View style={styles.flex}>
      {/* Glass samples the backdrop only. Pages and glass surfaces are siblings above it. */}
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

      <GlassSurface
        blur
        radius={GLASS.radius.capsule}
        onLayout={(event: LayoutChangeEvent) => setBarWidth(event.nativeEvent.layout.width)}
        style={[
          styles.bar,
          {
            bottom: insets.bottom + 12,
            left: BAR_INSET + insets.left,
            right: BAR_INSET + insets.right,
          },
        ]}
        contentStyle={styles.barContent}
        accessibilityRole="tablist"
      >
        <GestureDetector gesture={barSwipe}>
          <View style={styles.barContent}>
        {itemWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pill,
              { backgroundColor: colors.inverse, left: PILL_PADDING, top: PILL_PADDING, bottom: PILL_PADDING },
              pillStyle,
            ]}
          />
        ) : null}
        {TABS.map((tab, index) => (
          <TabItem
            key={tab.key}
            index={index}
            page={page}
            label={tab.label}
            icon={tab.icon}
            active={active === index}
            onPress={() => {
              haptic.select();
              goTo(index);
            }}
          />
        ))}
          </View>
        </GestureDetector>
      </GlassSurface>
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

function TabItem({
  index,
  page,
  label,
  icon,
  active,
  onPress,
}: {
  index: number;
  page: SharedValue<number>;
  label: string;
  icon: IconName;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const iconStyle = useAnimatedStyle(() => {
    const closeness = clamp(1 - Math.abs(index - page.value), 0, 1);
    return { transform: [{ scale: 1 + 0.12 * closeness }, { translateY: -1.5 * closeness }] };
  });
  // The label fades in as its pill passes over the tab, so the active tab always shows its name.
  const labelStyle = useAnimatedStyle(() => {
    const closeness = clamp(1 - Math.abs(index - page.value), 0, 1);
    return { opacity: closeness, transform: [{ translateY: (1 - closeness) * 3 }] };
  });
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={styles.item}
      hitSlop={6}
    >
      <Animated.View style={iconStyle}>
        <Icon name={icon} size={22} active={active} strokeWidth={1.6} color={active ? colors.inverseContent : colors.muted} />
      </Animated.View>
      <Animated.View style={labelStyle}>
        <AppText
          variant="label"
          numberOfLines={1}
          style={[styles.label, { fontFamily: active ? FONT.extrabold : FONT.bold }]}
          color={active ? colors.inverseContent : colors.muted}
        >
          {label}
        </AppText>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bar: {
    position: 'absolute',
    height: BAR_HEIGHT,
    borderRadius: SHAPE.full,
  },
  barContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PILL_PADDING,
  },
  pill: { position: 'absolute', borderRadius: SHAPE.full },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 1, height: BAR_HEIGHT - PILL_PADDING * 2 },
  label: { fontSize: 12, lineHeight: 15, letterSpacing: 0.2, textTransform: 'none' },
});

