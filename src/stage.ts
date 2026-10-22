import * as THREE from 'three';
import { applyExplosion, applyHighlight, type Model } from './models/common';
import { buildFit, cameraFor, FOV, type Fit } from './camera';
import { trap } from './story';
import { LABEL_WINDOWS, type Product, type LabelGroup } from './products';
import { setupRenderer, setupScene, disposeModel } from './lighting';
const NS = 'http://www.w3.org/2000/svg';
/** Which screen column a label group's callouts use: opposite the copy block of that beat. */
export const columnFor = (g: LabelGroup, soundRight?: boolean): 'l' | 'r' => (g === 'a' ? 'l' : g === 'b' && soundRight ? 'l' : 'r');
interface Callout { div: HTMLElement; line: SVGLineElement; dot: SVGCircleElement; part: THREE.Object3D; win: readonly number[]; col: 'l' | 'r'; k: number; n: number }
export class Stage {
  renderer: THREE.WebGLRenderer; scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100); model!: Model; product!: Product; fit!: Fit; glow: THREE.PointLight; aspect = 1;
  private callouts: Callout[] = []; private svg: SVGSVGElement | null = null; private tmp = new THREE.Vector3(); private box = new THREE.Box3();
  constructor(private canvas: HTMLCanvasElement, private host: HTMLElement | null, product: Product) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); setupRenderer(this.renderer); this.glow = setupScene(this.scene, this.renderer); this.setProduct(product);
  }
  setProduct(p: Product) {
    if (this.model) { this.scene.remove(this.model.root); disposeModel(this.model.root) }
    this.product = p; this.model = p.build(); this.scene.add(this.model.root); this.buildCallouts(); this.resize();
  }
  private buildCallouts() {
    const host = this.host; this.callouts = []; if (!host) return; host.innerHTML = ''; this.svg = document.createElementNS(NS, 'svg') as SVGSVGElement; this.svg.setAttribute('class', 'leaders'); host.appendChild(this.svg);
    const groups: Record<string, number> = {}; for (const l of this.product.labels) groups[l.group] = (groups[l.group] || 0) + 1; const idx: Record<string, number> = {};
    for (const l of this.product.labels) {
      const part = this.model.parts.find(q => q.name === l.part); if (!part) continue; const k = (idx[l.group] = (idx[l.group] ?? -1) + 1), col = columnFor(l.group, this.product.view.soundRight);
      const div = document.createElement('div'); div.className = 'lbl ' + col; div.innerHTML = `<span>${l.text}</span>`; host.appendChild(div);
      const line = document.createElementNS(NS, 'line') as SVGLineElement, dot = document.createElementNS(NS, 'circle') as SVGCircleElement; dot.setAttribute('r', '3.5'); this.svg.append(line, dot);
      this.callouts.push({ div, line, dot, part: part.pivot, win: LABEL_WINDOWS[l.group], col, k, n: groups[l.group] });
    }
  }
  resize() { const w = this.canvas.clientWidth || innerWidth, h = this.canvas.clientHeight || innerHeight; this.aspect = w / h; this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); this.renderer.setSize(w, h, false); this.camera.aspect = this.aspect; this.camera.updateProjectionMatrix(); this.fit = buildFit(this.model, this.aspect, this.product.view) }
  render(p: number, t: number) {
    const view = this.product.view, c = cameraFor(p, this.fit, view), mic = trap(p, 0.38, 0.46, 0.62, 0.7), drv = trap(p, 0.62, 0.7, 0.82, 0.88);
    applyExplosion(this.model, c.e, c.spread); applyHighlight(this.model, mic, drv);
    this.model.root.rotation.y = Math.sin(t * 0.3) * 0.04; this.model.root.position.y = Math.sin(t * 0.7) * 0.04; this.model.root.updateMatrixWorld(true);
    this.camera.position.copy(c.pos); this.camera.lookAt(c.target); this.camera.updateMatrixWorld();
    this.glow.intensity = (mic * 14 + drv * 9) * 0.6; this.glow.color.set(drv > mic ? 0x0050ff : 0x00d6ff);
    this.renderer.render(this.scene, this.camera);
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    for (const l of this.callouts) {
      const o = trap(p, l.win[0], l.win[1], l.win[2], l.win[3]); l.div.style.opacity = String(o); l.line.style.opacity = l.dot.style.opacity = String(o); if (o < 0.01) continue;
      this.box.setFromObject(l.part).getCenter(this.tmp); this.tmp.project(this.camera); const ax = (this.tmp.x * 0.5 + 0.5) * w, ay = (1 - (this.tmp.y * 0.5 + 0.5)) * h, tx = w * (l.col === 'r' ? 0.74 : 0.26), ty = h * 0.5 + (l.k - (l.n - 1) / 2) * 64;
      l.div.style.transform = `translate3d(${tx}px,${ty}px,0)`; l.line.setAttribute('x1', String(ax)); l.line.setAttribute('y1', String(ay)); l.line.setAttribute('x2', String(tx + (l.col === 'r' ? -8 : 8))); l.line.setAttribute('y2', String(ty)); l.dot.setAttribute('cx', String(ax)); l.dot.setAttribute('cy', String(ay));
    }
  }
  dispose() { disposeModel(this.model.root); this.renderer.dispose() }
}
