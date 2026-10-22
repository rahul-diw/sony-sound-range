import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { type Part, type Model, adder, V, E, mat, mesh, ACCENT, BLUE, makeDriver, hollowBox } from './common';
const BODY = 0x16171b, GRILLE = 0x0f1013, METAL = 0x2b2f3a;
/** Soundbar (left) with a wireless subwoofer (right). Both separate along the depth axis. */
export function makeTheater(): Model {
  const root = new THREE.Group(), parts: Part[] = [], add = adder(parts), rb = (w: number, h: number, d: number, r: number) => new RoundedBoxGeometry(w, h, d, 4, r);
  const bar = new THREE.Group(); bar.position.set(-1.3, 1.3, 0); root.add(bar); const BW = 7.0, BH = 0.95, BD = 1.25;
  add(bar, 'barshell', 'Soundbar housing', 'structure', 0, [hollowBox(BW, BH, BD, 0.08, mat(BODY, { r: 0.6, m: 0.12 }))], V(0, 0, 0), V(0, 0, -2.3));
  const strip = mesh(new THREE.BoxGeometry(1.2, 0.05, 0.05), mat(ACCENT, { r: 0.3, ec: ACCENT, e: 1.1 })); strip.position.set(0, 0, 0.06);
  add(bar, 'bargrille', 'Fabric grille', 'cap', 0, [mesh(rb(BW - 0.1, BH - 0.1, 0.1, 0.04), mat(GRILLE, { r: 0.85, m: 0.05 })), strip], V(0, 0, BD / 2 + 0.03), V(0, 0, 4.0));
  const faced = (r: number, tone?: number) => { const d = makeDriver(r, tone); d.rotation.x = Math.PI / 2; return d };
  add(bar, 'centerdriver', 'Center driver', 'driver', 0, [faced(0.36)], V(0, 0, 0.4), V(0, 0, 2.2), E(0, 0, 0.4));
  for (const s of [-1, 1] as const) {
    const nm = (n: string) => n + (s < 0 ? 'L' : 'R');
    add(bar, nm('woofer'), 'Woofer', 'driver', s, [faced(0.32)], V(s * 1.55, 0, 0.4), V(s * 1.55, 0, 2.7), E(0, 0, 0.4 * s));
    add(bar, nm('tweeter'), 'Tweeter', 'driver', s, [faced(0.2, 0x34373f)], V(s * 2.6, 0, 0.4), V(s * 2.6, 0, 3.2), E(0, 0, -0.4 * s));
    const up = makeDriver(0.27); add(bar, nm('upfire'), 'Up-firing driver', 'driver', s, [up], V(s * 0.85, BH / 2 - 0.15, 0.1), V(s * 0.85, 2.3, 0.3), E(0, 0.5 * s, 0));
    add(bar, nm('barcap'), 'End cap', 'cap', s, [mesh(rb(0.25, BH - 0.1, BD - 0.1, 0.08), mat(0x1c1d22, { r: 0.55, m: 0.2 }))], V(s * (BW / 2 + 0.1), 0, 0), V(s * 4.9, 0, -2.3));
  }
  const chip = (x: number, y: number, w: number, h: number, em = false) => { const c = mesh(new THREE.BoxGeometry(w, h, 0.07), mat(0x0a0b0e, { r: 0.3, m: 0.4, ...(em ? { ec: ACCENT, e: 0.4 } : {}) })); c.position.set(x, y, 0.06); return c };
  add(bar, 'barboard', 'Processing board', 'pcb', 0, [mesh(new THREE.BoxGeometry(5.2, 0.62, 0.06), mat(0x0a2a22, { r: 0.45, m: 0.3 })), chip(-1.6, 0, 0.7, 0.4, true), chip(-0.2, 0.05, 0.5, 0.3), chip(1.0, -0.05, 0.6, 0.3), chip(2.0, 0.05, 0.3, 0.25)], V(0, 0, -0.15), V(0, 0, 0.9));
  add(bar, 'psu', 'Power supply', 'structure', 0, [mesh(rb(2.2, 0.55, 0.4, 0.06), mat(0x3a3f4a, { r: 0.4, m: 0.7 }))], V(0, 0, -0.4), V(0, 0, -0.45));
  // wireless subwoofer
  const sub = new THREE.Group(); sub.position.set(5.0, -0.55, 0); root.add(sub); const SW = 2.2, SH = 2.6, SD = 2.2;
  add(sub, 'cabinet', 'Subwoofer cabinet', 'structure', 0, [hollowBox(SW, SH, SD, 0.14, mat(BODY, { r: 0.62, m: 0.1 }))], V(0, 0, 0), V(0, 0, -2.8));
  const sd = makeDriver(0.85); sd.rotation.x = Math.PI / 2; add(sub, 'subdriver', 'Bass driver', 'driver', 0, [sd], V(0, 0.2, SD / 2 - 0.1), V(0, 0.2, 3.0), E(0, 0, 0.3));
  add(sub, 'submagnet', 'Magnet', 'driver', 0, [(() => { const m = mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.5, 36), mat(0x3a3e49, { r: 0.3, m: 0.95 })); m.rotation.x = Math.PI / 2; return m })()], V(0, 0.2, 0.5), V(0, 0.2, 1.9));
  const port = mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.9, 28, 1, true), mat(0x0c0d10, { r: 0.6, m: 0.2 })); port.rotation.x = Math.PI / 2;
  add(sub, 'subport', 'Bass port', 'structure', 0, [port], V(-0.4, -0.95, 0.6), V(-0.4, -1.5, 1.0));
  const fins = Array.from({ length: 7 }, (_, i) => { const f = mesh(new THREE.BoxGeometry(0.06, 1.1, 0.25), mat(METAL, { r: 0.35, m: 0.85 })); f.position.set(-0.45 + i * 0.15, -0.1, -0.1); return f });
  add(sub, 'subamp', 'Amplifier', 'pcb', 0, [mesh(new THREE.BoxGeometry(1.5, 1.6, 0.06), mat(0x0a2a22, { r: 0.45, m: 0.3 })), ...fins, chip(0.5, 0.5, 0.5, 0.35, true)], V(0, 0, -0.3), V(0, 0, -0.3));
  return { root, parts, frames: [] };
}
