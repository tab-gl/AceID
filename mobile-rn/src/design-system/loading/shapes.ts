import { SHAPE_ORDER, SHAPE_PATHS } from './shape-paths';

// Turns the official M3 shape outlines into radius-per-angle tables, once, at module
// load. A shape is then a list of radii at fixed angles, so two shapes can be
// morphed by interpolating their radii. The M3 shapes are star-shaped around their
// centre, which makes this exact enough at indicator sizes.

export const SAMPLE_COUNT = 72;

type Point = { x: number; y: number };

/** Parses absolute M, L, H, C and Z path data into sampled points. */
function samplePathPoints(d: string): Point[][] {
  const tokens = d.match(/[MLHCZ]|-?\d*\.?\d+(?:e-?\d+)?/gi) ?? [];
  const rings: Point[][] = [];
  let ring: Point[] = [];
  let cursor: Point = { x: 0, y: 0 };
  let command = '';
  let i = 0;
  const next = () => Number.parseFloat(tokens[i++]);
  while (i < tokens.length) {
    if (/[A-Za-z]/.test(tokens[i])) {
      command = tokens[i++];
    }
    switch (command) {
      case 'M': {
        if (ring.length) rings.push(ring);
        cursor = { x: next(), y: next() };
        ring = [cursor];
        command = 'L';
        break;
      }
      case 'L': {
        cursor = { x: next(), y: next() };
        ring.push(cursor);
        break;
      }
      case 'H': {
        cursor = { x: next(), y: cursor.y };
        ring.push(cursor);
        break;
      }
      case 'C': {
        const c1 = { x: next(), y: next() };
        const c2 = { x: next(), y: next() };
        const end = { x: next(), y: next() };
        for (let s = 1; s <= 40; s += 1) {
          const t = s / 40;
          const u = 1 - t;
          ring.push({
            x: u * u * u * cursor.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * end.x,
            y: u * u * u * cursor.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * end.y,
          });
        }
        cursor = end;
        break;
      }
      case 'Z':
      case 'z': {
        if (ring.length) rings.push(ring);
        ring = [];
        command = '';
        break;
      }
      default:
        i += 1;
    }
  }
  if (ring.length) rings.push(ring);
  return rings;
}

/**
 * Radius at each of `count` evenly spaced angles, around the shape's centroid,
 * scaled so the 360-unit outline fits in radius 1.
 */
export function radiiForPath(d: string, count = SAMPLE_COUNT): number[] {
  const rings = samplePathPoints(d);
  const all = rings.flat();
  const cx = all.reduce((sum, p) => sum + p.x, 0) / all.length;
  const cy = all.reduce((sum, p) => sum + p.y, 0) / all.length;
  const sum = new Array<number>(count).fill(0);
  const hits = new Array<number>(count).fill(0);
  for (const p of all) {
    const angle = Math.atan2(p.y - cy, p.x - cx);
    const bin = Math.floor((((angle + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2)) * count) % count;
    sum[bin] += Math.hypot(p.x - cx, p.y - cy);
    hits[bin] += 1;
  }
  const radii = sum.map((value, i) => (hits[i] ? value / hits[i] : Number.NaN));
  // Fill empty angle bins from their neighbours, around the circle.
  const filled = radii.slice();
  for (let i = 0; i < count; i += 1) {
    if (Number.isNaN(filled[i])) {
      let left = i;
      while (Number.isNaN(radii[left])) left = (left - 1 + count) % count;
      let right = i;
      while (Number.isNaN(radii[right])) right = (right + 1) % count;
      const span = (right - left + count) % count || count;
      const t = ((i - left + count) % count) / span;
      filled[i] = radii[left] + (radii[right] - radii[left]) * t;
    }
  }
  const scale = 1 / 180;
  return filled.map((r) => r * scale);
}

/** One radius table per M3 loading shape, in keyframe order. */
export const SHAPE_RADII: number[][] = SHAPE_ORDER.map((name) => radiiForPath(SHAPE_PATHS[name]));
