// Native Material 3 Expressive views from react-native-m3 (Jetpack Compose on
// Android, its own views on iOS). They are optional: when the Nitro module is not
// linked (Jest, or a build made without the native pods/Gradle step), this is null
// and the design-system components use their own react-native-svg implementation.

import { Platform } from 'react-native';
import type * as M3Types from 'react-native-m3';

export type NativeM3 = Pick<typeof M3Types, 'LoadingIndicator' | 'WavyProgressIndicator'>;

function loadNativeM3(): NativeM3 | null {
  // react-native-m3 ships Android views only (its iOS pod is excluded in react-native.config.js).
  if (Platform.OS !== 'android') return null;
  try {
    const mod = require('react-native-m3') as Partial<NativeM3> | undefined;
    return mod?.LoadingIndicator && mod?.WavyProgressIndicator
      ? (mod as NativeM3)
      : null;
  } catch {
    return null;
  }
}

/** The native M3E views, or null when they are not available in this build. */
export const nativeM3: NativeM3 | null = loadNativeM3();
