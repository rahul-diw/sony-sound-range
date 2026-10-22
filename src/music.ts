import { explosion, smooth, trap, clamp } from './story';
/** Everything the soundtrack does is a pure function of scroll progress p, so audio and visuals can never drift apart. */
export interface Mix { e: number; tempo: number; kick: number; bass: number; hat: number; pad: number; cutoff: number; noise: number; lead: number; sub: number }
const END = (p: number) => (p > 0.985 ? 0 : 1);
/** The "world noise" bed: it fades in with the hero, then is CANCELLED during the noise-cancelling beat (0.44-0.51), mirroring the story. */
export const noiseBed = (p: number) => 0.13 * smooth(p / 0.08) * (1 - smooth((p - 0.44) / 0.07));
export function mix(p: number): Mix {
  const e = explosion(p);
  return { e, tempo: 68 + 16 * e, kick: smooth((p - 0.08) / 0.1) * (0.55 + 0.45 * e) * END(p), bass: smooth((p - 0.16) / 0.1) * (0.6 + 0.4 * e) * END(p), hat: smooth((p - 0.36) / 0.1) * (0.35 + 0.4 * e) * END(p), pad: 0.3 + 0.25 * e + 0.2 * smooth((p - 0.9) / 0.07), cutoff: 260 + 2900 * e + 900 * smooth((p - 0.9) / 0.08), noise: noiseBed(p), lead: trap(p, 0.64, 0.7, 0.84, 0.9), sub: 0.55 + 0.35 * e };
}
export const ROOTS = [41.2, 65.41, 49.0, 73.42]; // E1 C2 G1 D2 (E minor: i - VI - III - VII)
export const CHORDS = [[164.81, 196.0, 246.94], [130.81, 164.81, 196.0], [196.0, 246.94, 293.66], [146.83, 185.0, 220.0]];
export const LEAD = [659.26, 783.99, 987.77, 1174.66];
export const STEPS_PER_BAR = 16;
/** Gain automation never targets exactly 0 (exponential approaches to 0 are numerically fragile in some Web Audio implementations). */
const G = (x: number) => Math.max(0.0001, x);
/** Kick: half-time while calm, four-on-the-floor mid story, syncopated at the peak. */
export function kickVel(step: number, m: Mix) { const s = step % 16; if (m.kick < 0.02) return 0; if (m.e < 0.25) return (s === 0 ? 1 : s === 8 ? 0.7 : 0) * m.kick; const base = ({ 0: 1, 4: 0.8, 8: 0.9, 12: 0.8, 10: m.e > 0.7 ? 0.5 : 0, 14: m.e > 0.85 ? 0.4 : 0 } as Record<number, number>)[s] || 0; return base * m.kick }
export function bassHit(step: number, m: Mix): { dur: number; oct: number } | null { const s = step % 16; if (m.bass < 0.02) return null; const t: Record<number, [number, number]> = { 0: [3, 1], 3: [3, 1], 6: [4, m.e > 0.5 ? 2 : 1], 10: [2, 1], 12: [4, m.e > 0.5 ? 2 : 1] }; if (m.e > 0.6) t[14] = [2, 1]; const h = t[s]; return h ? { dur: h[0], oct: h[1] } : null }
export function hatVel(step: number, m: Mix) { const s = step % 16; if (m.hat < 0.02) return 0; if (s % 4 === 2) return 0.6 * m.hat; return m.e > 0.5 && s % 2 === 1 ? 0.28 * m.hat : 0 }
export function leadNote(step: number, m: Mix): number | null { if (m.lead < 0.05 || step % 2) return null; return LEAD[(step / 2 + Math.floor(step / 16)) % 4 | 0] }
export const ACCENTS: [number, 'riser' | 'cancel' | 'impact' | 'swell' | 'boom'][] = [[0.12, 'riser'], [0.46, 'cancel'], [0.7, 'impact'], [0.86, 'swell'], [0.97, 'boom']];

export class Soundtrack {
  readonly master: GainNode; readonly analyser: AnalyserNode; private duck: GainNode; private padFilter: BiquadFilterNode; private padGain: GainNode; private noiseGain: GainNode; private swishGain: GainNode; private subGain: GainNode; private bassFilter: BiquadFilterNode; private bassBus: GainNode; private leadBus: GainNode;
  private white: AudioBuffer; private brown: AudioBuffer; private padOsc: OscillatorNode[] = []; private sub: OscillatorNode; nextT = 0; step = 0; private lastP = 0; private fmt = new Uint8Array(1024);
  constructor(readonly ctx: BaseAudioContext) {
    const c = ctx, sr = c.sampleRate; this.master = c.createGain(); this.master.gain.value = 0.0001; const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 5; comp.attack.value = 0.004; comp.release.value = 0.2; this.master.connect(comp); comp.connect(c.destination);
    this.analyser = c.createAnalyser(); this.analyser.fftSize = 2048; this.master.connect(this.analyser); this.duck = c.createGain(); this.duck.connect(this.master);
    const w = c.createBuffer(1, sr * 2, sr), wd = w.getChannelData(0); for (let i = 0; i < wd.length; i++) wd[i] = Math.random() * 2 - 1; this.white = w;
    const b = c.createBuffer(1, sr * 4, sr), bd = b.getChannelData(0); let lastOut = 0; for (let i = 0; i < bd.length; i++) { const x = Math.random() * 2 - 1; lastOut = (lastOut + 0.02 * x) / 1.02; bd[i] = lastOut * 3.5 } this.brown = b;
    // pad: three detuned saw pairs through a moving low-pass
    this.padFilter = c.createBiquadFilter(); this.padFilter.type = 'lowpass'; this.padFilter.Q.value = 0.7; this.padGain = c.createGain(); this.padGain.gain.value = 0; this.padFilter.connect(this.padGain); this.padGain.connect(this.duck);
    for (let i = 0; i < 6; i++) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = CHORDS[0][i % 3]; o.detune.value = i < 3 ? -7 : 7; const g = c.createGain(); g.gain.value = 0.33; o.connect(g); g.connect(this.padFilter); o.start(); this.padOsc.push(o) }
    // continuous sub drone
    this.sub = c.createOscillator(); this.sub.type = 'sine'; this.sub.frequency.value = ROOTS[0]; this.subGain = c.createGain(); this.subGain.gain.value = 0; this.sub.connect(this.subGain); this.subGain.connect(this.duck); this.sub.start();
    // bass voices share a saturated low-pass so the bass is audible on laptop and phone speakers too
    this.bassFilter = c.createBiquadFilter(); this.bassFilter.type = 'lowpass'; this.bassFilter.frequency.value = 400; this.bassFilter.Q.value = 1.2; const sh = c.createWaveShaper(), cv = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = (i / 1023) * 2 - 1; cv[i] = Math.tanh(2.2 * x) } sh.curve = cv; this.bassBus = c.createGain(); this.bassBus.connect(sh); sh.connect(this.bassFilter); this.bassFilter.connect(this.duck);
    // noise bed (world noise, cancelled in the noise-cancelling beat) and scroll "swish"
    const nf = c.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.value = 1400; this.noiseGain = c.createGain(); this.noiseGain.gain.value = 0; const ns = c.createBufferSource(); ns.buffer = this.brown; ns.loop = true; ns.connect(nf); nf.connect(this.noiseGain); this.noiseGain.connect(this.master); ns.start();
    const sf = c.createBiquadFilter(); sf.type = 'bandpass'; sf.frequency.value = 2600; sf.Q.value = 0.8; this.swishGain = c.createGain(); this.swishGain.gain.value = 0; const ss = c.createBufferSource(); ss.buffer = this.white; ss.loop = true; ss.connect(sf); sf.connect(this.swishGain); this.swishGain.connect(this.master); ss.start();
    // lead plucks through a feedback delay
    this.leadBus = c.createGain(); const dl = c.createDelay(1); dl.delayTime.value = 0.375; const fb = c.createGain(); fb.gain.value = 0.38; dl.connect(fb); fb.connect(dl); this.leadBus.connect(this.master); this.leadBus.connect(dl); dl.connect(this.master);
    this.nextT = c.currentTime + 0.05;
  }
  private mv = 0.0001;
  fade(on: boolean, at = this.ctx.currentTime) { const g = this.master.gain, from = this.mv; this.mv = on ? 0.62 : 0.0001; g.cancelScheduledValues(at); g.setValueAtTime(from, at); g.linearRampToValueAtTime(this.mv, at + (on ? 1.4 : 0.4)) }
  private sm = new Map<AudioParam, { v: number; t: number }>();
  /** One-pole smoothing done here (not with setTargetAtTime, which is fragile when re-issued every frame): same result in every browser and offline. */
  private ease(param: AudioParam, target: number, tc: number, at: number) {
    let s = this.sm.get(param); if (!s) { s = { v: param.value, t: at }; this.sm.set(param, s) }
    const dt = Math.max(0, at - s.t), v = s.v + (target - s.v) * (1 - Math.exp(-dt / tc)); s.t = at; if (Math.abs(v - s.v) < 1e-6 + Math.abs(v) * 0.002) return; s.v = v; param.setValueAtTime(v, at);
  }
  /** Smooth, continuous parameters + accent hits when scroll crosses a story milestone. vel = scroll speed in progress/second. Call at ~30 Hz. */
  update(p: number, vel: number, at = this.ctx.currentTime) {
    const m = mix(p); this.ease(this.padFilter.frequency, m.cutoff, 0.15, at); this.ease(this.padGain.gain, G(m.pad * 0.2), 0.15, at); this.ease(this.noiseGain.gain, G(m.noise), 0.12, at); this.ease(this.subGain.gain, G(m.sub * 0.3), 0.25, at); this.ease(this.bassFilter.frequency, m.cutoff * 0.5 + 120, 0.15, at); this.ease(this.swishGain.gain, G(clamp(vel * 0.3, 0, 0.09)), 0.06, at);
    for (const [th, kind] of ACCENTS) { if (this.lastP < th && p >= th) this.accent(kind, at, 1); else if (this.lastP >= th && p < th) this.accent(kind, at, 0.35) }
    this.lastP = p;
  }
  /** Forget the previous scroll position without firing milestone accents (used when switching product). */
  reset(p = 0) { this.lastP = p }
  /** Low-frequency energy 0..1, used to make the page glow pulse with the bass. */
  bass() { this.analyser.getByteFrequencyData(this.fmt); let s = 0; for (let i = 1; i < 7; i++) s += this.fmt[i]; return s / 6 / 255 }
  private env(g: GainNode, t: number, peak: number, dur: number, atk = 0.006) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + atk); g.gain.exponentialRampToValueAtTime(0.0001, t + dur) }
  private noise(t: number, dur: number, type: BiquadFilterType, f0: number, f1: number, peak: number, atk: number) { const s = this.ctx.createBufferSource(); s.buffer = this.white; s.loop = true; const f = this.ctx.createBiquadFilter(); f.type = type; f.Q.value = 1.1; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur); const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + atk); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + dur + 0.05) }
  private tone(t: number, f0: number, f1: number, dur: number, peak: number, type: OscillatorType = 'sine') { const o = this.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur); const g = this.ctx.createGain(); this.env(g, t, peak, dur); o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05) }
  accent(kind: 'riser' | 'cancel' | 'impact' | 'swell' | 'boom', t: number, k: number) {
    if (k < 1) { this.noise(t, 0.35, 'bandpass', 1800, 700, 0.07, 0.03); return }
    if (kind === 'riser') { this.noise(t, 1.8, 'bandpass', 300, 6500, 0.16, 1.5); this.tone(t, 90, 360, 1.8, 0.08, 'sawtooth') }
    else if (kind === 'cancel') { this.noise(t, 1.3, 'lowpass', 7000, 180, 0.2, 0.02); this.tone(t, 880, 110, 1.1, 0.05) }
    else if (kind === 'impact') { this.tone(t, 70, 34, 0.9, 0.85); this.noise(t, 0.5, 'lowpass', 3000, 200, 0.12, 0.004) }
    else if (kind === 'swell') { this.noise(t, 1.6, 'bandpass', 500, 7000, 0.14, 1.3); this.tone(t, 130, 262, 1.6, 0.07, 'sawtooth') }
    else { this.tone(t, 64, 26, 2.2, 1.0); this.noise(t, 1.4, 'lowpass', 2500, 120, 0.15, 0.004) }
  }
  private kick(t: number, v: number) { const o = this.ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(44, t + 0.12); const g = this.ctx.createGain(); this.env(g, t, 0.95 * v, 0.42, 0.003); o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 0.5); this.noise(t, 0.03, 'highpass', 3000, 6000, 0.1 * v, 0.001); this.duck.gain.cancelScheduledValues(t); this.duck.gain.setValueAtTime(1 - 0.62 * v, t); this.duck.gain.linearRampToValueAtTime(1, t + 0.26) }
  private bassNote(t: number, f: number, dur: number, v: number) { const g = this.ctx.createGain(); this.env(g, t, 0.5 * v, dur, 0.012); for (const [type, mult, lv] of [['sine', 1, 1], ['sawtooth', 1, 0.45]] as const) { const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = f * mult; const og = this.ctx.createGain(); og.gain.value = lv; o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + 0.05) } g.connect(this.bassBus) }
  private hat(t: number, v: number) { this.noise(t, 0.05, 'highpass', 7000, 9000, 0.16 * v, 0.001) }
  private pluck(t: number, f: number, v: number) { const o = this.ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f; const g = this.ctx.createGain(); this.env(g, t, 0.1 * v, 0.5, 0.004); o.connect(g); g.connect(this.leadBus); o.start(t); o.stop(t + 0.6) }
  private pitch = new Map<AudioParam, number>();
  /** Pitch glide as hold + exponential ramp (explicit start value), robust in every Web Audio implementation. */
  private glide(param: AudioParam, f: number, t: number, dur: number) { const from = this.pitch.get(param) ?? param.value; this.pitch.set(param, f); if (from === f) return; param.setValueAtTime(from, t); param.exponentialRampToValueAtTime(f, t + dur) }
  /** Schedules musical events up to `until`; pAt maps an audio time to scroll progress so the groove follows the story. */
  schedule(until: number, pAt: (t: number) => number) {
    while (this.nextT < until) {
      const t = this.nextT, m = mix(pAt(t)), s = this.step % 16, bar = Math.floor(this.step / 16) % 4, kv = kickVel(this.step, m), bh = bassHit(this.step, m), hv = hatVel(this.step, m), ln = leadNote(this.step, m), sixteenth = 60 / m.tempo / 4;
      if (s === 0) { this.glide(this.sub.frequency, ROOTS[bar], t, 0.25); this.padOsc.forEach((o, i) => this.glide(o.frequency, CHORDS[bar][i % 3], t, 0.4)) }
      if (kv > 0) this.kick(t, kv); if (bh) this.bassNote(t, ROOTS[bar] * bh.oct, bh.dur * sixteenth * 0.95, m.bass); if (hv > 0) this.hat(t, hv); if (ln) this.pluck(t, ln, m.lead);
      this.nextT += sixteenth; this.step++;
    }
  }
  async close() { try { await (this.ctx as AudioContext).close?.() } catch { /* already closed */ } }
}
