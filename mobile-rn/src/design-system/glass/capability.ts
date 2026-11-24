// Decides how a Liquid Glass surface renders on a given platform. Kept pure so the
// thresholds can be unit tested without a device.
//
// - iOS 15.1+: react-native-blur-overlay uses UIVisualEffectView (live blur). On
//   iOS 26+ its `glass` mode uses UIGlassEffect, Apple's own Liquid Glass.
// - Android 12+ (API 31): live blur through RenderEffect over a <BlurTarget>. On
//   Android 13+ (API 33) `glass` adds the AGSL refracting lens. Below API 31 the
//   library would fall back to a static snapshot, which costs a capture each time,
//   so we do not ask for blur there at all.
// - Anything else: a translucent material with the rim and sheen, no backdrop blur.

export type GlassMode = 'blur' | 'material';

export interface GlassPlatform {
  os: string;
  /** iOS: the version string, such as "18.0". Android: the API level. */
  version: string | number;
}

export const MIN_IOS_BLUR = 15.1;
export const MIN_ANDROID_BLUR_API = 31;

export function chooseGlassMode({ os, version }: GlassPlatform): GlassMode {
  const numeric = typeof version === 'number' ? version : Number.parseFloat(String(version));
  if (!Number.isFinite(numeric)) return 'material';
  if (os === 'ios') return numeric >= MIN_IOS_BLUR ? 'blur' : 'material';
  if (os === 'android') return numeric >= MIN_ANDROID_BLUR_API ? 'blur' : 'material';
  return 'material';
}
