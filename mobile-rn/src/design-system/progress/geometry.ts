// Pure path geometry for the M3 Expressive progress indicators. Every function is a
// worklet so Reanimated can rebuild SVG paths on the UI thread every frame. The
// functions take plain numbers and return strings, so they also run under Jest.

const TWO_PI = Math.PI * 2;

/** Cubic-bezier easing, as CSS `cubic-bezier(x1, y1, x2, y2)`, evaluated at `t`. */
export function cubicBezierAt(t: number, x1: number, y1: number, x2: number, y2: number): number {
  'worklet';
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const sampleX = (s: number) => 3 * (1 - s) * (1 - s) * s * x1 + 3 * (1 - s) * s * s * x2 + s * s * s;
  const sampleY = (s: number) => 3 * (1 - s) * (1 - s) * s * y1 + 3 * (1 - s) * s * s * y2 + s * s * s;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 14; i += 1) {
    const mid = (lo + hi) / 2;
    if (sampleX(mid) < t) lo = mid;
    else hi = mid;
  }
  return sampleY((lo + hi) / 2);
}

/** Amplitude the wave should have for a determinate progress value (0..1). */
export function wavyAmplitudeTarget(progress: number, amplitude: number, indeterminate: boolean): number {
  'worklet';
  if (indeterminate) return Math.max(0, amplitude);
  return progress > 0.1 && progress < 0.95 ? Math.max(0, amplitude) : 0;
}

/**
 * Horizontal wave from x0 to x1 around the line y = centre. Sampled every few pixels.
 * `phase` shifts the wave along x (pixels), so animating it makes the wave travel.
 */
export function linearWavePath(
  x0: number,
  x1: number,
  centre: number,
  amplitude: number,
  wavelength: number,
  phase: number,
): string {
  'worklet';
  if (x1 - x0 < 0.5) return '';
  if (amplitude <= 0.01 || wavelength <= 0) {
    return `M${x0.toFixed(2)} ${centre.toFixed(2)}L${x1.toFixed(2)} ${centre.toFixed(2)}`;
  }
  const step = Math.max(1.5, wavelength / 14);
  let d = `M${x0.toFixed(2)} ${(centre + amplitude * Math.sin((TWO_PI * (x0 + phase)) / wavelength)).toFixed(2)}`;
  for (let x = x0 + step; x < x1; x += step) {
    d += `L${x.toFixed(2)} ${(centre + amplitude * Math.sin((TWO_PI * (x + phase)) / wavelength)).toFixed(2)}`;
  }
  d += `L${x1.toFixed(2)} ${(centre + amplitude * Math.sin((TWO_PI * (x1 + phase)) / wavelength)).toFixed(2)}`;
  return d;
}

/**
 * Arc of a circle from `startRad` over `sweepRad`, with a radial wave of `waves`
 * crests and amplitude `amplitude`. `phase` rotates the wave around the circle.
 */
export function circularWavePath(
  cx: number,
  cy: number,
  radius: number,
  amplitude: number,
  waves: number,
  phase: number,
  startRad: number,
  sweepRad: number,
): string {
  'worklet';
  if (sweepRad < 0.002 || radius <= 0) return '';
  const steps = Math.max(12, Math.min(240, Math.ceil((sweepRad / TWO_PI) * 180)));
  const point = (i: number) => {
    const theta = startRad + (sweepRad * i) / steps;
    const r = radius + (waves > 0 && amplitude > 0 ? amplitude * Math.sin(waves * theta + phase) : 0);
    return `${(cx + r * Math.cos(theta)).toFixed(2)} ${(cy + r * Math.sin(theta)).toFixed(2)}`;
  };
  let d = `M${point(0)}`;
  for (let i = 1; i <= steps; i += 1) d += `L${point(i)}`;
  return d;
}

/** Number of radial crests for a wavy circle, from its stroke circumference. */
export function circularWaveCount(diameter: number, strokeWidth: number, wavelength: number): number {
  'worklet';
  const circumference = Math.PI * Math.max(0, diameter - strokeWidth);
  return wavelength > 0 ? Math.min(256, Math.max(5, Math.round(circumference / wavelength))) : 5;
}
