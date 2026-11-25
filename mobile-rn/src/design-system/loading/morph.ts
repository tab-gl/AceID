import { cubicBezierAt } from '@/design-system/progress/geometry';

// Worklets that morph M3 shapes on the UI thread.

/** Blends two radius tables. `t` is 0..1. */
export function morphRadii(a: number[], b: number[], t: number): number[] {
  'worklet';
  const out = new Array<number>(a.length);
  for (let i = 0; i < a.length; i += 1) out[i] = a[i] + (b[i] - a[i]) * t;
  return out;
}

/**
 * Closed SVG path through the radius table, centred at (cx, cy), rotated by
 * `rotation` radians. Midpoints are used as quadratic control points, which keeps
 * the curve smooth on the sampled outline.
 */
export function shapePath(radii: number[], cx: number, cy: number, scale: number, rotation: number): string {
  'worklet';
  const n = radii.length;
  const step = (Math.PI * 2) / n;
  const px = (i: number) => {
    const k = (i + n) % n;
    const r = radii[k] * scale;
    return cx + r * Math.cos(k * step + rotation);
  };
  const py = (i: number) => {
    const k = (i + n) % n;
    const r = radii[k] * scale;
    return cy + r * Math.sin(k * step + rotation);
  };
  const mid = (i: number) => [(px(i) + px(i + 1)) / 2, (py(i) + py(i + 1)) / 2];
  const start = mid(n - 1);
  let d = `M${start[0].toFixed(2)} ${start[1].toFixed(2)}`;
  for (let i = 0; i < n; i += 1) {
    const m = mid(i);
    d += `Q${px(i).toFixed(2)} ${py(i).toFixed(2)} ${m[0].toFixed(2)} ${m[1].toFixed(2)}`;
  }
  return `${d}Z`;
}

/** M3 Expressive loading-indicator keyframes, from @m3e/web: time (0..1), shape, rotation (deg). */
export const LOADING_KEY_T = [0, 0.14, 0.29, 0.43, 0.57, 0.71, 0.83, 1];
/** Indices into SHAPE_ORDER: soft-burst, 9-sided cookie, pentagon, pill, sunny, 4-sided cookie, oval, soft-burst. */
export const LOADING_KEY_SHAPE = [5, 1, 3, 4, 6, 0, 2, 5];
export const LOADING_KEY_ROT = [0, 154, 309, 463, 617, 771, 926, 1080];
/** Keyframe easing: CSS cubic-bezier(0.34, 0.88, 0.34, 1). */
export const LOADING_EASE = [0.34, 0.88, 0.34, 1] as const;
export const LOADING_DURATION_MS = 4666;

/**
 * The indicator's shape at loop time `t` (0..1), with the outer linear rotation of
 * one turn per loop. `shapes` is the SHAPE_RADII table.
 */
export function loadingFrame(t: number, shapes: number[][], cx: number, cy: number, scale: number): string {
  'worklet';
  let i = 0;
  while (i < LOADING_KEY_T.length - 2 && t >= LOADING_KEY_T[i + 1]) i += 1;
  const span = LOADING_KEY_T[i + 1] - LOADING_KEY_T[i];
  const u = span > 0 ? (t - LOADING_KEY_T[i]) / span : 0;
  const e = cubicBezierAt(u, LOADING_EASE[0], LOADING_EASE[1], LOADING_EASE[2], LOADING_EASE[3]);
  const radii = morphRadii(shapes[LOADING_KEY_SHAPE[i]], shapes[LOADING_KEY_SHAPE[i + 1]], e);
  const innerDeg = LOADING_KEY_ROT[i] + (LOADING_KEY_ROT[i + 1] - LOADING_KEY_ROT[i]) * e;
  const outerDeg = t * 360;
  return shapePath(radii, cx, cy, scale, ((innerDeg + outerDeg) * Math.PI) / 180);
}
