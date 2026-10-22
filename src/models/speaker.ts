import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { type Part, type Model, adder, V, E, mat, mesh, ACCENT, BLUE, makeDriver, hollowBox } from './common';
const BODY = 0x17181c, GRILLE = 0x0f1013, METAL = 0x2b2f3a, W = 5.0, H = 2.4, D = 2.0;
/** Portable party speaker: parts separate along the depth axis (grille toward the viewer, housing away). */
export function makeSpeaker(): Model {
  const root = new THREE.Group(), parts: Part[] = [], add = adder(parts), rb = (w: number, h: number, d: number, r: number) => new RoundedBoxGeometry(w, h, d, 4, r);
  add(root, 'shell', 'Rear housing', 'structure', 0, [hollowBox(W, H, D, 0.14, mat(BODY, { r: 0.62, m: 0.1 }))], V(0, 0, 0), V(0, 0, -3.0));
  const edge = (y: number) => { const b = mesh(new THREE.BoxGeometry(W - 0.15, 0.05, 0.16), mat(BLUE, { r: 0.3, m: 0.5, ec: BLUE, e: 0.9 })); b.position.set(0, y, 0.0); return b }, logo = mesh(new THREE.BoxGeometry(0.7, 0.05, 0.14), mat(ACCENT, { r: 0.3, ec: ACCENT, e: 1.1 })); logo.position.set(0, -H / 2 + 0.3, 0.05);
  add(root, 'grille', 'Protective grille', 'cap', 0, [mesh(rb(W - 0.2, H - 0.2, 0.12, 0.05), mat(GRILLE, { r: 0.8, m: 0.1 })), edge(H / 2 - 0.2), edge(-H / 2 + 0.2), logo], V(0, 0, D / 2 + 0.04), V(0, 0, 4.7));
  for (const s of [-1, 1] as const) {
    const nm = (n: string) => n + (s < 0 ? 'L' : 'R'), drv = makeDriver(0.82); drv.rotation.x = Math.PI / 2;
    add(root, nm('woofer'), 'Woofer', 'driver', s, [drv], V(s * 1.35, -0.12, 0.85), V(s * 1.35, -0.12, 3.0), E(0, 0, 0.5 * s));
    add(root, nm('magnet'), 'Magnet', 'driver', s, [(() => { const m = mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.4, 36), mat(0x3a3e49, { r: 0.3, m: 0.95 })); m.rotation.x = Math.PI / 2; return m })()], V(s * 1.35, -0.12, 0.5), V(s * 1.35, -0.12, 1.85));
    add(root, nm('endcap'), 'End cap', 'cap', s, [mesh(rb(0.3, H - 0.3, D - 0.2, 0.1), mat(0x1c1d22, { r: 0.55, m: 0.2 })), (() => { const r = mesh(new THREE.TorusGeometry(0.55, 0.03, 10, 40).rotateY(Math.PI / 2), mat(ACCENT, { r: 0.3, ec: ACCENT, e: 0.9 })); r.position.x = s * 0.16; return r })()], V(s * (W / 2 + 0.1), 0, 0), V(s * 4.1, 0, -3.0));
  }
  const tw = makeDriver(0.38, 0x34373f); tw.rotation.x = Math.PI / 2; add(root, 'tweeter', 'Tweeter', 'driver', 0, [tw], V(0, 0.55, 0.9), V(0, 0.55, 3.85), E(0, 0, 0.4));
  const chip = (x: number, y: number, w: number, h: number, em = false) => { const c = mesh(new THREE.BoxGeometry(w, h, 0.07), mat(0x0a0b0e, { r: 0.3, m: 0.4, ...(em ? { ec: ACCENT, e: 0.4 } : {}) })); c.position.set(x, y, 0.06); return c };
  add(root, 'amp', 'Amplifier board', 'pcb', 0, [mesh(new THREE.BoxGeometry(3.9, 1.5, 0.06), mat(0x0a2a22, { r: 0.45, m: 0.3 })), chip(-1.2, 0.2, 0.7, 0.5, true), chip(0.2, -0.3, 0.5, 0.4), chip(1.2, 0.3, 0.6, 0.3), chip(1.4, -0.4, 0.3, 0.3)], V(0, 0, -0.1), V(0, 0, 0.95));
  add(root, 'battery', 'Battery pack', 'structure', 0, [mesh(rb(3.3, 1.1, 0.5, 0.1), mat(0x3a3f4a, { r: 0.4, m: 0.7 })), (() => { const t = mesh(new THREE.BoxGeometry(2.0, 0.08, 0.06), mat(BLUE, { r: 0.4, ec: BLUE, e: 0.5 })); t.position.z = 0.28; return t })()], V(0, 0, -0.6), V(0, 0, -0.2));
  const hp = new THREE.CatmullRomCurve3(Array.from({ length: 21 }, (_, i) => { const t = (i / 20) * Math.PI; return new THREE.Vector3(Math.cos(t) * 1.7, Math.sin(t) * 0.7, 0) }));
  add(root, 'handle', 'Carry handle', 'structure', 0, [mesh(new THREE.TubeGeometry(hp, 60, 0.11, 12), mat(0x1a1b20, { r: 0.55, m: 0.15 }))], V(0, H / 2, 0), V(0, 3.0, -2.6), E(0.2, 0, 0));
  const btn = (x: number) => { const b = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 20), mat(0x2b2f3a, { r: 0.4, m: 0.6 })); b.position.set(x, 0.09, 0); return b };
  add(root, 'controls', 'Control panel', 'pcb', 0, [mesh(rb(2.4, 0.12, 0.7, 0.04), mat(0x101114, { r: 0.5, m: 0.2 })), btn(-0.7), btn(0), btn(0.7)], V(0, H / 2 + 0.05, 0.3), V(0, 2.1, 0.4));
  return { root, parts, frames: [] };
}
