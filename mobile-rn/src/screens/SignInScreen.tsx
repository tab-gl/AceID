import React, { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/api/errors';
import { webUrl, WEB } from '@/config';
import { useBreathe, useEnter, useReduceMotion } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { FONT, HAIRLINE, SPACE, springFor } from '@/theme/tokens';
import { Logo } from '@/ui/Logo';
import { AppText } from '@/ui/Text';
import { Button, Eyebrow, Rule } from '@/ui/primitives';
import { useToast } from '@/ui/Toast';

const CAPABILITIES = ['Passkeys', 'TOTP two-factor', 'Recovery codes', 'Connected-app control'];

export function SignInScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const breathe = useBreathe(0.02);
  const hero = useEnter(0, { base: 120, distance: 22 });
  const copy = useEnter(1, { base: 120, distance: 18 });
  const actions = useEnter(2, { base: 120, distance: 18 });
  const ruleGrow = useRule();

  const onSignIn = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await signIn();
    } catch (cause) {
      toast.show(errorMessage(cause, 'Sign-in failed. Try again.'), 'danger');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + SPACE.xxl, paddingBottom: insets.bottom + SPACE.xl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={[styles.brand, actions]}>
        <Logo height={30} delay={60} />
        <Animated.View style={[styles.brandRule, { backgroundColor: colors.border }, ruleGrow]} />
      </Animated.View>

      <Animated.View style={[styles.hero, hero]}>
        <AppText variant="displayXL" accessibilityRole="header">
          Fast by design.
        </AppText>
        <AppText
          variant="displayXL"
          color={colors.muted}
          style={{ fontFamily: FONT.serifItalic }}
        >
          Secure by default.
        </AppText>
      </Animated.View>

      <Animated.View style={copy}>
        <AppText variant="body" color={colors.muted}>
          Ace ID is one identity across Ace Base services, with sessions, access and security controls kept in your hands.
        </AppText>
      </Animated.View>

      <Animated.View style={[styles.chips, copy]}>
        {CAPABILITIES.map((item) => (
          <View key={item} style={[styles.chip, { borderColor: colors.border }]}>
            <AppText variant="bodySmall" color={colors.muted}>
              {item}
            </AppText>
          </View>
        ))}
      </Animated.View>

      <Animated.View style={[styles.actions, actions]}>
        <Animated.View style={breathe}>
          <Button
            label={busy ? 'Opening Ace ID' : 'Continue with Ace ID'}
            icon="shieldCheck"
            fullWidth
            loading={busy}
            onPress={onSignIn}
            accessibilityHint="Opens the secure Ace ID sign-in page in your browser"
          />
        </Animated.View>
        <Button
          label="Create an Ace ID"
          variant="ghost"
          icon="arrow"
          fullWidth
          onPress={() => Linking.openURL(webUrl(WEB.register)).catch(() => toast.show('Could not open the Ace ID site.', 'danger'))}
        />
      </Animated.View>

      <Rule spacing={SPACE.xl} />

      <Animated.View style={[styles.footer, actions]}>
        <Eyebrow>Secure authentication</Eyebrow>
        <AppText variant="bodySmall" color={colors.muted}>
          Sign-in happens in the system browser through OpenID Connect with PKCE. Ace ID never sees your password in this app.
        </AppText>
      </Animated.View>
    </ScrollView>
  );
}

/** Draws a hairline rule outward from the brand mark. */
function useRule() {
  const reduce = useReduceMotion();
  const progress = useSharedValue(reduce ? 1 : 0);
  useEffect(() => {
    if (reduce) return;
    progress.value = withDelay(260, withSpring(1, springFor('slow-spatial')));
  }, [progress, reduce]);
  return useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
    width: '100%',
    height: HAIRLINE,
  }));
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: SPACE.xl, gap: SPACE.lg, minHeight: '100%', justifyContent: 'space-between' },
  brand: { gap: SPACE.md },
  brandRule: { height: HAIRLINE },
  hero: { gap: 2, marginTop: SPACE.xl },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.xs },
  chip: { borderWidth: HAIRLINE, paddingVertical: 4, paddingHorizontal: SPACE.sm },
  actions: { gap: SPACE.sm, marginTop: SPACE.md },
  footer: { gap: SPACE.xs },
});
