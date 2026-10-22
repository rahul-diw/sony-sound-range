export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const smooth = (x: number) => { x = clamp(x); return x * x * (3 - 2 * x) };
/** Fades in over [a,b], holds until c, fades out over [c,d]. */
export const trap = (p: number, a: number, b: number, c: number, d: number) => smooth((p - a) / (b - a)) * (1 - smooth((p - c) / (d - c)));
/** Monotone cubic interpolation (Fritsch-Carlson): smooth velocity, never overshoots the keyframes. */
export function mono(pts: [number, number][]) {
  const n = pts.length, dx: number[] = [], m: number[] = [], t: number[] = Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) { dx.push(pts[i + 1][0] - pts[i][0]); m.push((pts[i + 1][1] - pts[i][1]) / dx[i]) }
  t[0] = m[0]; t[n - 1] = m[n - 2]; for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i++) { if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue } const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b; if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i] } }
  return (x: number) => { if (x <= pts[0][0]) return pts[0][1]; if (x >= pts[n - 1][0]) return pts[n - 1][1]; let i = 0; while (x > pts[i + 1][0]) i++; const h = dx[i], s = (x - pts[i][0]) / h, s2 = s * s, s3 = s2 * s; return (2 * s3 - 3 * s2 + 1) * pts[i][1] + (s3 - 2 * s2 + s) * h * t[i] + (-2 * s3 + 3 * s2) * pts[i + 1][1] + (s3 - s2) * h * t[i + 1] };
}
/** Explosion amount 0..1 versus scroll progress: assembled hero, drift apart, spread, hold for the sound beat, reassemble. */
export const explosion = mono([[0, 0], [0.12, 0], [0.4, 0.55], [0.65, 1], [0.85, 1], [1, 0]]);
export const FRAMES = 120;
export const frameAt = (p: number, count = FRAMES) => Math.min(count - 1, Math.max(0, Math.round(clamp(p) * (count - 1))));
/** Story beats: where each copy block lives on the scroll axis. */
export const BEATS = {
  hero: [-0.02, -0.01, 0.09, 0.15], engineering: [0.17, 0.23, 0.35, 0.41], noise: [0.43, 0.49, 0.6, 0.66], sound: [0.68, 0.74, 0.8, 0.86], cta: [0.88, 0.94, 1.01, 1.02],
} as const;
export const beat = (name: keyof typeof BEATS, p: number) => { const b = BEATS[name]; return trap(p, b[0], b[1], b[2], b[3]) };
export const NAV_TARGETS = { Overview: 0, Technology: 0.2, 'Noise Cancelling': 0.46, Specs: -1, Buy: -2 } as const;
export const SECTIONS = ['Overview', 'Engineering', 'Noise Cancelling', 'Sound', 'Reassemble'] as const;
export const sectionAt = (p: number) => (p < 0.16 ? 0 : p < 0.42 ? 1 : p < 0.67 ? 2 : p < 0.87 ? 3 : 4);
