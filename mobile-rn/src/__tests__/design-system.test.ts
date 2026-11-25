import { chooseGlassMode, MIN_ANDROID_BLUR_API, MIN_IOS_BLUR } from '@/design-system/glass/capability';
import { monochromeRoles } from '@/design-system/tokens/m3-monochrome';
import { circularWaveCount, cubicBezierAt, wavyAmplitudeTarget } from '@/design-system/progress/geometry';
import { LOADING_KEY_ROT, LOADING_KEY_SHAPE, LOADING_KEY_T, morphRadii } from '@/design-system/loading/morph';

describe('glass capability', () => {
  it('uses blur on iOS 15.1+ and Android API 31+ only', () => {
    expect(MIN_IOS_BLUR).toBe(15.1);
    expect(MIN_ANDROID_BLUR_API).toBe(31);
    expect(chooseGlassMode({ os: 'ios', version: '15.1' })).toBe('blur');
    expect(chooseGlassMode({ os: 'ios', version: '18.0' })).toBe('blur');
    expect(chooseGlassMode({ os: 'ios', version: '15.0' })).toBe('material');
    expect(chooseGlassMode({ os: 'android', version: 31 })).toBe('blur');
    expect(chooseGlassMode({ os: 'android', version: 30 })).toBe('material');
  });

  it('falls back to material for unknown platforms or bad versions', () => {
    expect(chooseGlassMode({ os: 'web', version: 99 })).toBe('material');
    expect(chooseGlassMode({ os: 'ios', version: 'unknown' })).toBe('material');
  });
});

describe('monochrome M3 roles', () => {
  const grey = (hex: string) => {
    const r = hex.slice(1, 3);
    const g = hex.slice(3, 5);
    const b = hex.slice(5, 7);
    return r === g && g === b;
  };

  it('yields hex colours with no chroma (monochrome scheme)', () => {
    const roles = monochromeRoles(false);
    // `error` is the one fixed hue in the M3 scheme; everything else is neutral.
    const { error, ...neutral } = roles;
    for (const value of Object.values(neutral)) {
      expect(value).toMatch(/^#[0-9a-f]{6}$/);
      expect(grey(value)).toBe(true);
    }
    expect(error).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('inverts primary and surface between light and dark', () => {
    const light = monochromeRoles(false);
    const dark = monochromeRoles(true);
    expect(light.primary).not.toBe(dark.primary);
    const lum = (hex: string) => parseInt(hex.slice(1, 3), 16);
    expect(lum(light.surface)).toBeGreaterThan(lum(dark.surface));
    expect(lum(dark.primary)).toBeGreaterThan(lum(dark.surface));
  });

  it('caches per mode', () => {
    expect(monochromeRoles(true)).toBe(monochromeRoles(true));
  });
});

describe('progress geometry', () => {
  it('cubic bezier hits its endpoints and stays monotone for M3 easing', () => {
    expect(cubicBezierAt(0, 0.2, 0, 0, 1)).toBeCloseTo(0, 2);
    expect(cubicBezierAt(1, 0.2, 0, 0, 1)).toBeCloseTo(1, 2);
    let prev = 0;
    for (let i = 1; i <= 10; i += 1) {
      const v = cubicBezierAt(i / 10, 0.2, 0, 0, 1);
      expect(v).toBeGreaterThanOrEqual(prev - 1e-6);
      prev = v;
    }
  });

  it('wavy amplitude is active only in the mid range or indeterminate', () => {
    expect(wavyAmplitudeTarget(0.5, 3, false)).toBe(3);
    expect(wavyAmplitudeTarget(0.05, 3, false)).toBe(0);
    expect(wavyAmplitudeTarget(0.98, 3, false)).toBe(0);
    expect(wavyAmplitudeTarget(0, 3, true)).toBe(3);
  });

  it('circular wave count is clamped to the spec range', () => {
    const count = circularWaveCount(48, 4, 15);
    expect(count).toBeGreaterThanOrEqual(5);
    expect(count).toBeLessThanOrEqual(256);
    expect(circularWaveCount(1000, 0, 1)).toBe(256);
    expect(circularWaveCount(4, 0, 100)).toBe(5);
  });
});

describe('loading morph keyframes', () => {
  it('match the M3 Expressive keyframe timing and rotations', () => {
    expect(LOADING_KEY_T).toEqual([0, 0.14, 0.29, 0.43, 0.57, 0.71, 0.83, 1]);
    expect(LOADING_KEY_ROT).toEqual([0, 154, 309, 463, 617, 771, 926, 1080]);
    // soft-burst -> 9-sided -> pentagon -> pill -> sunny -> 4-sided -> oval -> soft-burst
    expect(LOADING_KEY_SHAPE).toEqual([5, 1, 3, 4, 6, 0, 2, 5]);
  });

  it('morphRadii interpolates between two radius sets', () => {
    expect(morphRadii([1, 1], [3, 5], 0)).toEqual([1, 1]);
    expect(morphRadii([1, 1], [3, 5], 1)).toEqual([3, 5]);
    expect(morphRadii([1, 1], [3, 5], 0.5)).toEqual([2, 3]);
  });
});
