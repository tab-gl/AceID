import React, { useCallback, useEffect, useState } from 'react';
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
import { springFor, HAIRLINE, SHAPE, FONT } from '@/theme/tokens';
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

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-16, 16])
    .onBegin(() => {
      dragStart.value = page.value;
    })
    .onUpdate((event) => {
      page.value = clamp(dragStart.value - event.translationX / width, -0.12, TABS.length - 0.88);
    })
    .onEnd((event) => {
      const projected = page.value - event.velocityX / width * 0.25;
      const target = clamp(Math.round(projected), 0, TABS.length - 1);
      page.value = withSpring(target, springFor('default-spatial'));
      runOnJS(goTo)(target);
    });

  const itemWidth = barWidth > 0 ? (barWidth - PILL_PADDING * 2) / TABS.length : 0;
  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: page.value * itemWidth }],
    width: itemWidth,
  }));

  return (
    <View style={styles.flex}>
      <GestureDetector gesture={pan}>
        <View style={styles.flex}>
          {TABS.map((tab, index) => (
            <PageSlot key={tab.key} index={index} page={page} width={width}>
              {visited.includes(index) ? <tab.Screen active={active === index} openTab={goTo} /> : null}
            </PageSlot>
          ))}
        </View>
      </GestureDetector>

      <View
        onLayout={(event: LayoutChangeEvent) => setBarWidth(event.nativeEvent.layout.width)}
        style={[
          styles.bar,
          {
            bottom: insets.bottom + 12,
            left: BAR_INSET + insets.left,
            right: BAR_INSET + insets.right,
            backgroundColor: colors.panel,
            borderColor: colors.border,
          },
        ]}
        accessibilityRole="tablist"
      >
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
      <AppText
        variant="eyebrow"
        style={[styles.label, { fontFamily: active ? FONT.extrabold : FONT.bold }]}
        color={active ? colors.inverseContent : colors.muted}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bar: {
    position: 'absolute',
    height: BAR_HEIGHT,
    borderRadius: SHAPE.full,
    borderWidth: HAIRLINE,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PILL_PADDING,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  pill: { position: 'absolute', borderRadius: SHAPE.full },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, height: BAR_HEIGHT - PILL_PADDING * 2 },
  label: { fontSize: 10, letterSpacing: 0.4, textTransform: 'none' },
});

