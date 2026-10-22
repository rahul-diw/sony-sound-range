// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
vi.mock('three', async importOriginal => {
  const T: any = await importOriginal();
  class WebGLRenderer { renders = 0; constructor(_o?: any) {} setClearColor() {} setPixelRatio() {} setSize() {} render() { this.renders++ } dispose() {} forceContextLoss() {} }
  class PMREMGenerator { constructor(_r?: any) {} fromScene() { return { texture: {} } } dispose() {} }
  return { ...T, WebGLRenderer, PMREMGenerator };
});
import { Stage } from '../src/stage';
import { PRODUCTS, byId } from '../src/products';

describe('Stage (everything except the GPU draw call)', () => {
  const mk = (id: string) => { const canvas = document.createElement('canvas'), host = document.createElement('div'); Object.defineProperty(canvas, 'clientWidth', { value: 1280 }); Object.defineProperty(canvas, 'clientHeight', { value: 720 }); return { stage: new Stage(canvas, host, byId(id)), host } };
  it('creates one callout per label plus leader lines, hidden until their story window', () => {
    const { stage, host } = mk('wh-1000xm6'); const lbls = host.querySelectorAll('.lbl'); expect(lbls.length).toBe(9); expect(host.querySelectorAll('svg.leaders line').length).toBe(9); expect(host.querySelectorAll('svg.leaders circle').length).toBe(9);
    stage.render(0.0, 0); expect([...lbls].every(l => (l as HTMLElement).style.opacity === '0')).toBe(true); expect((stage.renderer as any).renders).toBe(1);
  });
  it('shows the engineering callouts on the right, the electronics callouts on the left, and the sound callouts opposite that beat\'s copy', () => {
    for (const id of ['wh-1000xm6', 'srs-xg300']) { const { stage, host } = mk(id), pr = byId(id), vis = (g: string, p: number) => pr.labels.map((l, i) => ({ l, el: host.querySelectorAll('.lbl')[i] as HTMLElement })).filter(x => x.l.group === g && Number(x.el.style.opacity) > 0.9);
      stage.render(0.31, 1); const eng = vis('eng', 0.31); expect(eng.length, id + ' eng count').toBe(3); expect(eng.every(x => x.el.className.includes(' r')), id + ' eng class').toBe(true); expect(eng.every(x => /translate3d\(9\d\d(\.\d+)?px/.test(x.el.style.transform)), id + ' eng transform ' + eng.map(x => x.el.style.transform).join('|')).toBe(true);
      stage.render(0.55, 1); const a = vis('a', 0.55); expect(a.length).toBe(pr.labels.filter(l => l.group === 'a').length); expect(a.every(x => x.el.className.includes(' l')), id + ' a class').toBe(true);
      stage.render(0.775, 1); const b = vis('b', 0.775); expect(b.length, id + ' b count').toBe(3); expect(b.every(x => x.el.className.includes(pr.view.soundRight ? ' l' : ' r')), id + ' b class').toBe(true);
      const lines = host.querySelectorAll('svg.leaders line'); expect([...lines].some(l => Number(l.getAttribute('x1')) > 0 && Number(l.getAttribute('x2')) > 0), id + ' lines').toBe(true) }
  });
  it('swaps products cleanly: old model and callouts are replaced, fit is rebuilt, every product renders', () => {
    const { stage, host } = mk('wh-1000xm6'); const oldRoot = stage.model.root, fit0 = stage.fit;
    for (const p of PRODUCTS.slice(1)) { stage.setProduct(p); expect(stage.product.id).toBe(p.id); expect(stage.model.root).not.toBe(oldRoot); expect(host.querySelectorAll('.lbl').length).toBe(p.labels.length); expect(host.querySelectorAll('svg').length).toBe(1); expect(stage.scene.children.filter(c => (c as any).isGroup).length).toBe(1); for (const t of [0, 0.3, 0.55, 0.8, 1]) stage.render(t, 2) }
    expect(stage.fit).not.toBe(fit0); stage.resize(); expect(stage.fit.dist.length).toBeGreaterThan(10); stage.dispose();
  });
});
