// Renders the real Soundtrack engine offline through a scripted scroll (hero -> peak -> reassembly) and analyses it.
import { OfflineAudioContext } from 'node-web-audio-api';
import fs from 'node:fs';
import { Soundtrack, mix } from '../src/music';
const SR = 44100, DUR = 44, KEYS: [number, number][] = [[0, 0], [3, 0], [15, 0.4], [17, 0.4], [26, 0.7], [30, 0.7], [39, 1], [44, 1]];
export const pAt = (t: number) => { for (let i = 1; i < KEYS.length; i++) if (t <= KEYS[i][0]) { const a = KEYS[i - 1], b = KEYS[i]; return a[1] + (b[1] - a[1]) * ((t - a[0]) / (b[0] - a[0] || 1)) } return 1 };
export const events: { kind: string; t: number }[] = [];
export async function render() {
  const ctx = new OfflineAudioContext(2, SR * DUR, SR), st = new Soundtrack(ctx as unknown as BaseAudioContext) as any; st.fade(true, 0);
  for (const k of ['kick', 'bassNote', 'hat', 'pluck']) { const o = st[k].bind(st); st[k] = (t: number, ...a: any[]) => { events.push({ kind: k, t }); return o(t, ...a) } }
  for (let t = 0; t < DUR; t += 0.05) { const p = pAt(t); st.update(p, Math.abs(pAt(t + 0.05) - p) / 0.05, t); st.schedule(t + 0.3, pAt) }
  return ctx.startRendering();
}
function fft(re: Float64Array, im: Float64Array) { const n = re.length; for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]] } } for (let len = 2; len <= n; len <<= 1) { const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang); for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const a = i + k, b = a + len / 2, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr; re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti; const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr } } } }
export const BANDS: [string, number, number][] = [['sub 20-60', 20, 60], ['bass 60-150', 60, 150], ['low-mid 150-500', 150, 500], ['mid 500-2k', 500, 2000], ['high 2k+', 2000, 20000]];
export function analyse(x: Float32Array, t0: number, t1: number) {
  const N = 8192, e = BANDS.map(() => 0); let rms = 0, cnt = 0; for (let s = Math.floor(t0 * SR); s + N < Math.floor(t1 * SR); s += N) { const re = new Float64Array(N), im = new Float64Array(N); for (let i = 0; i < N; i++) { const w = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N); re[i] = x[s + i] * w; rms += x[s + i] * x[s + i]; cnt++ } fft(re, im); for (let k = 1; k < N / 2; k++) { const f = k * SR / N, pw = re[k] * re[k] + im[k] * im[k]; BANDS.forEach((b, i) => { if (f >= b[1] && f < b[2]) e[i] += pw }) } }
  const tot = e.reduce((a, b) => a + b, 0) || 1; return { rmsDb: 20 * Math.log10(Math.sqrt(rms / Math.max(1, cnt)) + 1e-9), share: e.map(v => v / tot) };
}
export function bpm(x: Float32Array, t0: number, t1: number) {
  const win = Math.floor(SR * 0.01), env: number[] = []; let lp = 0; for (let s = Math.floor(t0 * SR); s < Math.floor(t1 * SR); s++) lp += 0.02 * (Math.abs(x[s]) - lp), s % win === 0 && env.push(lp);
  const mean = env.reduce((a, b) => a + b, 0) / env.length, d = env.map(v => v - mean); let best = 0, bl = 0; for (let lag = 40; lag <= 120; lag++) { let c = 0; for (let i = 0; i + lag < d.length; i++) c += d[i] * d[i + lag]; if (c > best) { best = c; bl = lag } } return 60 / (bl * 0.01);
}
if (process.argv[1].endsWith('render-audio.ts')) {
  const buf = await render(), L = buf.getChannelData(0), R = buf.getChannelData(1); let peak = 0, nan = 0; for (let i = 0; i < L.length; i++) { peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); if (!Number.isFinite(L[i])) nan++ }
  console.log('samples', L.length, '| peak', peak.toFixed(3), '| NaN', nan);
  const segs: [string, number, number][] = [['hero (p=0)', 0.5, 3], ['engineering (p~.2)', 7, 11], ['world noise present (p~.4)', 15.2, 17], ['noise cancelled (p~.47-.55)', 20.6, 23], ['peak: sound beat (p=.7)', 26.5, 30], ['reassembled end (p=1)', 41, 44]];
  for (const [n, a, b] of segs) { const r = analyse(L, a, b); console.log(n.padEnd(30), 'RMS', r.rmsDb.toFixed(1), 'dB |', BANDS.map((bd, i) => bd[0].split(' ')[0] + ' ' + (r.share[i] * 100).toFixed(0) + '%').join('  ')) }
  const k = events.filter(e => e.kind === 'kick').map(e => e.t), ioi = (a: number, b: number) => { const x = k.filter(t => t >= a && t < b); return x.slice(1).map((t, i) => t - x[i]) }, med = (v: number[]) => v.sort((a, b) => a - b)[v.length >> 1];
  console.log('kick spacing (median) at p=.7:', med(ioi(27, 30)).toFixed(3), 's  = 16th note at', (60 / 84 / 4).toFixed(3), 's x', Math.round(med(ioi(27, 30)) / (60 / 84 / 4)), 'steps (design: 4 = a beat at 84 BPM)');
  const cnt = (kind: string, a: number, b: number) => events.filter(e => e.kind === kind && e.t >= a && e.t < b).length;
  console.log('events  hero(0-3s) kick', cnt('kick', 0, 3), 'bass', cnt('bassNote', 0, 3), 'hat', cnt('hat', 0, 3), '| p~.2 (7-11s) kick', cnt('kick', 7, 11), 'bass', cnt('bassNote', 7, 11), 'hat', cnt('hat', 7, 11), '| peak (27-30s) kick', cnt('kick', 27, 30), 'bass', cnt('bassNote', 27, 30), 'hat', cnt('hat', 27, 30), 'lead', cnt('pluck', 27, 30), '| end (40-44s) kick', cnt('kick', 40, 44));
  const mx = mix(0.7); console.log('mix(0.7).tempo', mx.tempo);
  const pcm = Buffer.alloc(L.length * 4); for (let i = 0; i < L.length; i++) { pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(L[i] * 32767))), i * 4); pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(R[i] * 32767))), i * 4 + 2) }
  const h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  fs.writeFileSync('/tmp/xm6-soundtrack.wav', Buffer.concat([h, pcm])); console.log('wrote /tmp/xm6-soundtrack.wav');
}
