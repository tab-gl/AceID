import RNHapticFeedback from 'react-native-haptic-feedback';

// Haptics are a supplement, never a requirement: a device without a haptic
// engine, or a failed call, must not affect the app.
const OPTIONS = { enableVibrateFallback: false, ignoreAndroidSystemSettings: false };

export const haptic = {
  tap: () => safe(() => RNHapticFeedback.trigger('impactLight', OPTIONS)),
  select: () => safe(() => RNHapticFeedback.trigger('selection', OPTIONS)),
  success: () => safe(() => RNHapticFeedback.trigger('notificationSuccess', OPTIONS)),
  warning: () => safe(() => RNHapticFeedback.trigger('notificationWarning', OPTIONS)),
  heavy: () => safe(() => RNHapticFeedback.trigger('impactHeavy', OPTIONS)),
};

function safe(fn: () => void) {
  try {
    fn();
  } catch {
    // Ignore: haptics are optional.
  }
}
