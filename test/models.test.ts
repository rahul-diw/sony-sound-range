import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { applyExplosion, applyHighlight } from '../src/models/common';
import { buildFit, cameraFor, FOV } from '../src/camera';
import { PRODUCTS, LABEL_WINDOWS, byId, idFromHash, hashFor, type Product } from '../src/products';
import { columnFor } from '../src/stage';

const cameraAt = (pr: Product, p: number, aspect: number) => { const m = pr.build(), fit = buildFit(m, aspect, pr.view), c = cameraFor(p, fit, pr.view); applyExplosion(m, c.e, c.spread); const cam = new THREE.PerspectiveCamera(FOV, aspect, 0.1, 100); cam.position.copy(c.pos); cam.lookAt(c.target); cam.updateMatrixWorld(); cam.updateProjectionMatrix(); return { m, cam } };
describe.each(PRODUCTS.map(p => [p.name, p] as const))('%s model', (_n, pr) => {
  it('builds a complete set of named parts with finite geometry and the tags the story needs', () => {
    const m = pr.build(); applyExplosion(m, 0); expect(m.parts.length).toBeGreaterThanOrEqual(12); expect(new Set(m.parts.map(p => p.name)).size).toBe(m.parts.length);
    const tags = new Set(m.parts.map(p => p.tag)); expect(tags.has('pcb')).toBe(true); expect(tags.has('driver')).toBe(true);
    m.root.traverse(o => { const me = o as THREE.Mesh; if (me.isMesh) { const pos = me.geometry.attributes.position; for (let i = 0; i < pos.count; i += 7) { expect(Number.isFinite(pos.getX(i) + pos.getY(i) + pos.getZ(i))).toBe(true) } } });
  });
  it('keeps every part inside the frame at every scroll position on desktop, laptop and portrait screens', () => {
    for (const aspect of [16 / 9, 4 / 3, 9 / 19]) { const m = pr.build(), fit = buildFit(m, aspect, pr.view), v = new THREE.Vector3();
      for (let p = 0; p <= 1.0001; p += 0.05) { const c = cameraFor(p, fit, pr.view); applyExplosion(m, c.e, c.spread); const cam = new THREE.PerspectiveCamera(FOV, aspect, 0.1, 100); cam.position.copy(c.pos); cam.lookAt(c.target); cam.updateMatrixWorld(); cam.updateProjectionMatrix(); let worst = 0, behind = 0;
        m.root.traverse(o => { const me = o as THREE.Mesh; if (!me.isMesh) return; const pos = me.geometry.attributes.position; for (let i = 0; i < pos.count; i += 3) { v.fromBufferAttribute(pos, i).applyMatrix4(me.matrixWorld).project(cam); if (v.z > 1) behind++; worst = Math.max(worst, Math.abs(v.x), Math.abs(v.y)) } });
        expect(behind, `behind camera ${aspect.toFixed(2)} p=${p.toFixed(2)}`).toBe(0); expect(worst, `${pr.id} aspect ${aspect.toFixed(2)} p=${p.toFixed(2)}`).toBeLessThan(0.98) } }
  });
  it('explodes into a clean diagram: no parts collide in the fully exploded state', () => {
    const m = pr.build(); applyExplosion(m, 1, 1); m.tilts?.forEach(g => g.rotation.set(0, 0, 0)); m.root.updateMatrixWorld(true);
    const boxes = m.parts.map(p => ({ n: p.name, b: new THREE.Box3().setFromObject(p.pivot, true) })), bad: string[] = [], base = (n: string) => n.replace(/[LR]?\d?$/, '');
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) { const a = boxes[i], b = boxes[j]; const s = a.b.clone().intersect(b.b); if (!s.isEmpty()) { const v = s.getSize(new THREE.Vector3()); if (v.x * v.y * v.z > 0.0008) bad.push(`${a.n}x${b.n}`) } }
    expect(bad).toEqual([]);
  });
  it('highlights light only the right parts and restore afterwards', () => {
    const m = pr.build(), mic = m.parts.find(p => p.tag === 'mic' || p.tag === 'pcb')!, drv = m.parts.find(p => p.tag === 'driver')!, em = (p: typeof mic) => p.mats[0].emissiveIntensity, e0 = em(mic), d0 = em(drv);
    applyHighlight(m, 1, 0); expect(em(mic)).toBeGreaterThan(e0); expect(em(drv)).toBeCloseTo(d0, 6); applyHighlight(m, 0, 1); expect(em(drv)).toBeGreaterThan(d0); applyHighlight(m, 0, 0); expect(em(mic)).toBeCloseTo(e0, 6); expect(em(drv)).toBeCloseTo(d0, 6);
  });
  it('callout labels point at real parts that are in frame, on the correct side, in their story window', () => {
    for (const g of ['eng', 'a', 'b'] as const) { const ls = pr.labels.filter(l => l.group === g); expect(ls.length, `${pr.id} ${g}`).toBeGreaterThanOrEqual(2); expect(ls.length).toBeLessThanOrEqual(3);
      const w = LABEL_WINDOWS[g], p = (w[1] + w[2]) / 2, { m, cam } = cameraAt(pr, p, 16 / 9), col = columnFor(g, pr.view.soundRight);
      for (const l of ls) { const part = m.parts.find(q => q.name === l.part); expect(part, `${pr.id}: ${l.part} exists`).toBeTruthy(); const v = new THREE.Box3().setFromObject(part!.pivot).getCenter(new THREE.Vector3()).project(cam);
        expect(Math.abs(v.x) < 0.95 && Math.abs(v.y) < 0.95, `${pr.id}/${l.part} in frame (${v.x.toFixed(2)},${v.y.toFixed(2)})`).toBe(true); expect(col === 'r' ? v.x > -0.2 : v.x < 0.2, `${pr.id}/${l.part} sits on the ${col} side (x=${v.x.toFixed(2)})`).toBe(true) } }
  });
});
describe('product catalogue and routing', () => {
  it('has four products with unique ids, complete copy and specs', () => {
    expect(PRODUCTS.map(p => p.id)).toEqual(['wh-1000xm6', 'wf-1000xm5', 'srs-xg300', 'ht-a7000']); expect(new Set(PRODUCTS.map(p => p.name)).size).toBe(4); expect(new Set(PRODUCTS.map(p => p.category)).size).toBe(4);
    for (const p of PRODUCTS) { const c = p.copy; for (const t of [c.hero.eyebrow, c.hero.title, c.hero.sub, c.hero.body, c.eng.title, ...c.eng.lines, c.feat.title, ...c.feat.points, c.sound.title, ...c.sound.lines, ...c.cta.title, c.cta.sub, c.cta.micro, p.blurb, p.specsTitle, p.nav.feature]) expect(t.length, p.id).toBeGreaterThan(3); expect(c.hero.title).toContain(p.name); expect(c.cta.sub).toContain(p.name); expect(p.specs.length).toBe(6); expect(p.labels.length).toBeGreaterThanOrEqual(8) }
  });
  it('round-trips product ids through the URL hash and falls back to the flagship', () => {
    for (const p of PRODUCTS) expect(idFromHash(hashFor(p.id))).toBe(p.id); expect(hashFor('wh-1000xm6')).toBe('#/'); expect(idFromHash('')).toBe('wh-1000xm6'); expect(idFromHash('#/p/does-not-exist')).toBe('wh-1000xm6'); expect(idFromHash('#specs')).toBe('wh-1000xm6'); expect(byId('srs-xg300').name).toBe('SRS-XG300');
  });
  it('keeps the story beats off the labels: callout columns are opposite the copy of each beat', () => { expect(columnFor('eng')).toBe('r'); expect(columnFor('a')).toBe('l'); expect(columnFor('b', false)).toBe('r'); expect(columnFor('b', true)).toBe('l') });
});
