import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { FONT, GLASS, HAIRLINE, SHAPE, SPACE, TYPE, springFor } from '@/design-system/tokens';
import { GlassSurface } from '@/design-system/glass';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './Text';

/** A labelled input whose underline draws in on focus. */
export function TextField({
  label,
  value,
  onChangeText,
  prefix,
  keyboardType,
  autoCapitalize = 'sentences',
  autoComplete,
  placeholder,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  prefix?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'off' | 'email' | 'name' | 'username';
  placeholder?: string;
  editable?: boolean;
}) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const underline = useSharedValue(0);
  useEffect(() => {
    underline.value = withSpring(focused ? 1 : 0, springFor('fast-spatial'));
  }, [focused, underline]);
  const underlineStyle = useAnimatedStyle(() => ({ width: `${Math.round(underline.value * 100)}%` }));

  return (
    <View style={styles.wrap}>
      <AppText variant="eyebrow" color={focused ? colors.content : colors.muted}>
        {label}
      </AppText>
      <GlassSurface tone="panel" radius={GLASS.radius.field} contentStyle={styles.field}>
      <View style={styles.row}>
        {prefix ? <AppText variant="titleMedium" color={colors.muted}>{prefix}</AppText> : null}
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={false}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          selectionColor={colors.content}
          style={[styles.input, { color: colors.content, fontFamily: FONT.medium }, !editable && styles.readOnly]}
        />
      </View>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <Animated.View style={[styles.fill, { backgroundColor: colors.content }, underlineStyle]} />
      </View>
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  readOnly: { opacity: 0.5 },
  wrap: { gap: SPACE.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs, minHeight: 40 },
  input: { flex: 1, fontSize: TYPE.body.fontSize, paddingVertical: SPACE.xs, paddingHorizontal: 0 },
  field: { paddingHorizontal: SPACE.md, paddingTop: SPACE.xs, gap: 0 },
  track: { height: HAIRLINE, overflow: 'hidden', borderRadius: SHAPE.none, marginBottom: SPACE.xs },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
});
