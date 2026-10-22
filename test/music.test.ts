import { describe, it, expect, beforeAll } from 'vitest';
import { mix, noiseBed, kickVel, bassHit, hatVel, leadNote, ACCENTS, LEAD } from '../src/music';
import { render, analyse, events } from '../scripts/render-audio';

describe('soundtrack follows the scroll story (pure)', () => {
  it('is calm in the hero: sub drone and pad only, no drums', () => { const m = mix(0); expect(m.kick).toBe(0); expect(m.bass).toBe(0); expect(m.hat).toBe(0); expect(m.sub).toBeGreaterThan(0.5); expect(m.tempo).toBe(68) });
  it('builds with the explosion: tempo, filter and layers rise to the peak, and the groove stops when reassembled', () => {
    const a = mix(0.2), b = mix(0.5), c = mix(0.75); expect(b.tempo).toBeGreaterThan(a.tempo); expect(c.tempo).toBeCloseTo(84, 5); expect(c.cutoff).toBeGreaterThan(b.cutoff); expect(b.cutoff).toBeGreaterThan(a.cutoff); expect(c.kick).toBeGreaterThan(a.kick);
    expect(mix(0.12).kick).toBeGreaterThan(0); expect(mix(0.2).hat).toBeLessThan(0.05); expect(mix(0.5).hat).toBeGreaterThan(0.2);
    const end = mix(0.99); expect(end.kick + end.bass + end.hat).toBe(0); expect(end.pad).toBeGreaterThan(mix(0.5).pad * 0.9);
  });
  it('mirrors the story: world noise exists early and is cancelled in the noise-cancelling beat', () => { expect(noiseBed(0)).toBe(0); expect(noiseBed(0.2)).toBeGreaterThan(0.1); expect(noiseBed(0.4)).toBeGreaterThan(0.1); expect(noiseBed(0.46)).toBeLessThan(noiseBed(0.4)); expect(noiseBed(0.52)).toBeLessThan(0.002); expect(noiseBed(0.8)).toBeLessThan(0.002) });
  it('lead plucks appear only during the sound beat', () => { expect(mix(0.3).lead).toBe(0); expect(mix(0.77).lead).toBeGreaterThan(0.9); expect(mix(0.95).lead).toBe(0); expect(leadNote(0, mix(0.3))).toBeNull(); expect(LEAD).toContain(leadNote(0, mix(0.77))!); expect(leadNote(1, mix(0.77))).toBeNull() });
  it('drum patterns: half-time when calm, four-on-the-floor mid story, syncopated at the peak', () => {
    const hits = (p: number) => Array.from({ length: 16 }, (_, s) => kickVel(s, mix(p)) > 0 ? s : -1).filter(s => s >= 0);
    expect(hits(0.14)).toEqual([0, 8]); expect(hits(0.3)).toEqual([0, 4, 8, 12]); expect(hits(0.5)).toEqual([0, 4, 8, 10, 12]); expect(hits(0.75)).toEqual([0, 4, 8, 10, 12, 14]); expect(bassHit(0, mix(0.1))).toBeNull(); expect(bassHit(0, mix(0.5))).not.toBeNull(); expect(hatVel(2, mix(0.2))).toBe(0); expect(hatVel(2, mix(0.6))).toBeGreaterThan(0);
  });
  it('accent milestones are ordered and inside the story', () => { const th = ACCENTS.map(a => a[0]); expect([...th].sort((a, b) => a - b)).toEqual(th); expect(th[0]).toBeGreaterThan(0); expect(th.at(-1)).toBeLessThan(1) });
});
describe('real audio render of the scroll story (offline Web Audio)', () => {
  let L: Float32Array, peak = 0, nan = 0;
  beforeAll(async () => { const buf = await render(); L = buf.getChannelData(0); for (let i = 0; i < L.length; i++) { peak = Math.max(peak, Math.abs(L[i])); if (!Number.isFinite(L[i])) nan++ } }, 120000);
  it('never clips or produces invalid samples', () => { expect(nan).toBe(0); expect(peak).toBeGreaterThan(0.2); expect(peak).toBeLessThan(0.95) });
  it('is audible from the very first second (calm hero, not silence)', () => { expect(analyse(L, 1, 3).rmsDb).toBeGreaterThan(-35) });
  it('is genuinely bass-heavy: sub + bass carry most of the energy through the whole story', () => { for (const [a, b] of [[7, 11], [15.2, 17], [20.6, 23], [26.5, 30], [41, 44]] as const) { const s = analyse(L, a, b).share; expect(s[0] + s[1], `${a}-${b}s`).toBeGreaterThan(0.7) } const hero = analyse(L, 1, 3).share; expect(hero[0] + hero[1]).toBeGreaterThan(0.7) });
  it('gets louder toward the peak and relaxes at the end', () => { expect(analyse(L, 26.5, 30).rmsDb).toBeGreaterThan(analyse(L, 1, 3).rmsDb + 3); expect(analyse(L, 41, 44).rmsDb).toBeLessThan(analyse(L, 26.5, 30).rmsDb) });
  it('schedules drums exactly on the grid and only where the story calls for them', () => {
    const k = events.filter(e => e.kind === 'kick').map(e => e.t), n = (kind: string, a: number, b: number) => events.filter(e => e.kind === kind && e.t >= a && e.t < b).length;
    expect(n('kick', 0, 3)).toBe(0); expect(n('hat', 0, 11)).toBe(0); expect(n('hat', 27, 30)).toBeGreaterThan(8); expect(n('pluck', 0, 24)).toBe(0); expect(n('pluck', 27, 30)).toBeGreaterThan(4); expect(n('kick', 40, 44)).toBe(0);
    const sixteenth = 60 / 84 / 4, peakK = k.filter(t => t >= 27 && t < 30); for (let i = 1; i < peakK.length; i++) { const steps = (peakK[i] - peakK[i - 1]) / sixteenth; expect(Math.abs(steps - Math.round(steps)), 'kick on grid').toBeLessThan(0.12) }
  });
});
