import { describe, it, expect } from 'vitest';
import { explosion, trap, beat, BEATS, frameAt, mono, sectionAt, FRAMES } from '../src/story';

describe('scroll story', () => {
  it('explosion is 0 at the hero, 1 at the peak, 0 again when reassembled, and never overshoots', () => {
    expect(explosion(0)).toBe(0); expect(explosion(0.1)).toBe(0); expect(explosion(0.7)).toBeCloseTo(1, 5); expect(explosion(0.8)).toBeCloseTo(1, 5); expect(explosion(1)).toBe(0);
    for (let p = 0; p <= 1; p += 0.002) { const e = explosion(p); expect(e).toBeGreaterThanOrEqual(-1e-9); expect(e).toBeLessThanOrEqual(1 + 1e-9) }
  });
  it('rises monotonically while parts separate and falls monotonically while they reassemble', () => {
    let prev = 0; for (let p = 0.12; p <= 0.65; p += 0.005) { const e = explosion(p); expect(e).toBeGreaterThanOrEqual(prev - 1e-9); prev = e }
    prev = 1; for (let p = 0.85; p <= 1; p += 0.005) { const e = explosion(p); expect(e).toBeLessThanOrEqual(prev + 1e-9); prev = e }
  });
  it('has no velocity jumps (smooth, buttery motion)', () => { let maxJump = 0, prev = explosion(0); for (let p = 0.0005; p <= 1; p += 0.0005) { const e = explosion(p); maxJump = Math.max(maxJump, Math.abs(e - prev)); prev = e } expect(maxJump).toBeLessThan(0.006) });
  it('monotone interpolation hits its keyframes', () => { const f = mono([[0, 0], [1, 2], [2, 2]]); expect(f(1)).toBe(2); expect(f(0.5)).toBeGreaterThan(0); expect(f(1.5)).toBeCloseTo(2, 5) });
  it('each copy beat is fully visible inside its window and hidden elsewhere', () => {
    for (const k of Object.keys(BEATS) as (keyof typeof BEATS)[]) { const b = BEATS[k]; expect(beat(k, (b[1] + b[2]) / 2)).toBeCloseTo(1, 5); if (b[0] > 0) expect(beat(k, Math.max(0, b[0] - 0.02))).toBe(0) }
    expect(beat('hero', 0)).toBeGreaterThan(0.9); expect(beat('hero', 0.3)).toBe(0); expect(beat('cta', 1)).toBeGreaterThan(0.99);
  });
  it('never shows two copy blocks at once', () => { for (let p = 0; p <= 1; p += 0.005) { const vis = (Object.keys(BEATS) as (keyof typeof BEATS)[]).filter(k => beat(k, p) > 0.25); expect(vis.length).toBeLessThanOrEqual(1) } });
  it('maps scroll to the 120-frame sequence', () => { expect(frameAt(0)).toBe(0); expect(frameAt(1)).toBe(FRAMES - 1); expect(frameAt(0.5)).toBeGreaterThan(55); expect(frameAt(2)).toBe(FRAMES - 1); expect(frameAt(-1)).toBe(0); expect(trap(0.5, 0.4, 0.45, 0.55, 0.6)).toBe(1); expect([0, 0.3, 0.5, 0.8, 0.95].map(sectionAt)).toEqual([0, 1, 2, 3, 4]) });
});
