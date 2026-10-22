import { frameAt, FRAMES } from './story';
/** Optional photorealistic image sequence per product: drop 0001.jpg ... 0120.jpg into /public/frames/<product-id>/ (background #050505) and it replaces that product's 3D stage. */
export const framePath = (id: string, i: number) => `${import.meta.env.BASE_URL}frames/${id}/${String(i + 1).padStart(4, '0')}.jpg`;
const load = (src: string) => new Promise<HTMLImageElement>((ok, no) => { const im = new Image(); im.decoding = 'async'; im.onload = () => ok(im); im.onerror = () => no(new Error('missing ' + src)); im.src = src });
export class FrameSequence {
  imgs: HTMLImageElement[] = []; ctx: CanvasRenderingContext2D; last = -1;
  constructor(private canvas: HTMLCanvasElement, private id: string) { this.ctx = canvas.getContext('2d', { alpha: false })! }
  /** True when the first and last frame exist. */
  static async available(id: string) { try { await Promise.all([load(framePath(id, 0)), load(framePath(id, FRAMES - 1))]); return true } catch { return false } }
  async preload(onProgress: (n: number) => void) { let n = 0; this.imgs = await Promise.all(Array.from({ length: FRAMES }, (_, i) => load(framePath(this.id, i)).then(im => { onProgress(++n); return im }))) }
  resize() { const d = Math.min(devicePixelRatio || 1, 2); this.canvas.width = Math.round((this.canvas.clientWidth || innerWidth) * d); this.canvas.height = Math.round((this.canvas.clientHeight || innerHeight) * d); this.last = -1 }
  draw(p: number) {
    const i = frameAt(p, this.imgs.length || FRAMES); if (i === this.last || !this.imgs[i]) return; this.last = i; const im = this.imgs[i], W = this.canvas.width, H = this.canvas.height, s = Math.min(W / im.naturalWidth, H / im.naturalHeight);
    this.ctx.fillStyle = '#050505'; this.ctx.fillRect(0, 0, W, H); this.ctx.drawImage(im, (W - im.naturalWidth * s) / 2, (H - im.naturalHeight * s) / 2, im.naturalWidth * s, im.naturalHeight * s);
  }
}
