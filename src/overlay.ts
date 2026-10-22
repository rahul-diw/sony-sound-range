import { beat, BEATS, clamp } from './story';
export type BeatName = keyof typeof BEATS;
export interface BeatEl { name: BeatName; el: { style: Record<string, any> }; dir: 'up' | 'left' | 'right' }
/** Applies the scroll-driven fade/slide/blur to each copy block. Pure over element-like objects so it can be unit tested. */
export function updateBeats(els: BeatEl[], p: number) {
  for (const b of els) {
    const o = beat(b.name, p), d = 1 - o, x = b.dir === 'left' ? -64 * d : b.dir === 'right' ? 64 * d : 0, y = b.dir === 'up' ? 28 * d : 0;
    b.el.style.opacity = String(Math.round(o * 1000) / 1000); b.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`; b.el.style.filter = o > 0.99 ? 'none' : `blur(${(d * 8).toFixed(1)}px)`; b.el.style.pointerEvents = o > 0.6 ? 'auto' : 'none'; b.el.style.visibility = o < 0.003 ? 'hidden' : 'visible';
  }
}
export const progressOf = (top: number, height: number, vh: number) => clamp(-top / Math.max(1, height - vh));
