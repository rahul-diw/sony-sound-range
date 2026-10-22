import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { type Part, type Model, adder, V, E, mat, lathe, mesh, ACCENT, BLUE, makeDriver } from './common';
const BLACK = 0x15161a, BLACK2 = 0x1d1f26, SIL = 0x0e0f12, METAL = 0x2b2f3a;
/** Pair of true-wireless earbuds (axis along +-X, tips facing each other) above an opening charging case. */
export function makeEarbuds(): Model {
  const root = new THREE.Group(), parts: Part[] = [], frames: Model['frames'] = [], tilts: THREE.Group[] = [], add = adder(parts), rb = (w: number, h: number, d: number, r: number) => new RoundedBoxGeometry(w, h, d, 4, r);
  for (const s of [-1, 1] as const) {
    const g = new THREE.Group(), nm = (n: string) => n + (s < 0 ? 'L' : 'R'); g.position.set(s * 1.9, 0.9, 0); g.rotation.z = -s * Math.PI / 2; root.add(g); frames.push({ g, base: V(s * 1.9, 0.9, 0), exp: V(s * 2.5, 0.9, 0) });
    const ring = mesh(new THREE.TorusGeometry(0.56, 0.016, 12, 72).rotateX(Math.PI / 2), mat(BLUE, { r: 0.3, m: 0.6, ec: BLUE, e: 0.9 }));
    add(g, nm('cap'), 'Touch panel', 'cap', s, [mesh(lathe([[0, 0.06], [0.54, 0.04], [0.62, 0], [0.54, -0.03], [0, -0.03]]), mat(BLACK2, { r: 0.5, m: 0.25 })), ring], V(0, 0.55, 0), V(0, 3.25, 0), E(0, 0.55 * s, 0));
    add(g, nm('shell'), 'Housing', 'structure', s, [mesh(lathe([[0, 0.5], [0.36, 0.46], [0.56, 0.3], [0.64, 0.05], [0.58, -0.25], [0.42, -0.46], [0.22, -0.56], [0.2, -0.5], [0.38, -0.4], [0.52, -0.22], [0.58, 0.03], [0.5, 0.27], [0.32, 0.41], [0, 0.43]]), mat(BLACK, { r: 0.55, m: 0.15 }))], V(0, 0, 0), V(0, 2.4, 0));
    add(g, nm('tip'), 'Ear tip', 'cushion', s, [mesh(lathe([[0.15, 0], [0.3, 0.18], [0.36, 0.34], [0.3, 0.5], [0.2, 0.56], [0.17, 0.5], [0.24, 0.34], [0.2, 0.18]]), mat(SIL, { r: 0.92, m: 0 }))], V(0, -0.98, 0), V(0, -2.35, 0));
    const mesh2 = mesh(new THREE.CircleGeometry(0.15, 24).rotateX(-Math.PI / 2), mat(0x0a0b0e, { r: 0.8 })); mesh2.position.y = 0.26;
    add(g, nm('nozzle'), 'Acoustic nozzle', 'structure', s, [mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.5, 28), mat(METAL, { r: 0.4, m: 0.7 })), mesh2], V(0, -0.66, 0), V(0, -1.45, 0));
    const drv = makeDriver(0.36); add(g, nm('driver'), 'Driver unit', 'driver', s, [drv], V(0, -0.2, 0), V(0, -0.75, 0), E(0, -0.4 * s, 0));
    add(g, nm('coil'), 'Voice coil', 'driver', s, [mesh(new THREE.TorusGeometry(0.17, 0.025, 10, 40).rotateX(Math.PI / 2), mat(0xb87333, { r: 0.35, m: 0.9 }))], V(0, -0.05, 0), V(0, -0.1, 0), E(0, 0.3 * s, 0));
    add(g, nm('magnet'), 'Magnet', 'driver', s, [mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.16, 32), mat(0x3a3e49, { r: 0.3, m: 0.95 }))], V(0, 0.05, 0), V(0, 0.5, 0), E(0, -0.3 * s, 0));
    add(g, nm('battery'), 'Battery cell', 'structure', s, [mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.15, 32), mat(0x3a3f4a, { r: 0.4, m: 0.7 })), (() => { const t = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.17, 20), mat(BLUE, { r: 0.4, ec: BLUE, e: 0.5 })); return t })()], V(0, 0.2, 0), V(0, 1.05, 0), E(0.15, 0, 0));
    const board = mesh(new THREE.BoxGeometry(0.62, 0.04, 0.48), mat(0x0a2a22, { r: 0.45, m: 0.3 })), chip = mesh(new THREE.BoxGeometry(0.2, 0.05, 0.2), mat(0x0a0b0e, { r: 0.3, m: 0.4, ec: ACCENT, e: 0.35 })); chip.position.set(-0.1, 0.04, 0.05);
    add(g, nm('board'), 'Processing board', 'pcb', s, [board, chip], V(0.02, 0.32, 0), V(0.05, 1.55, 0), E(0, 0, 0.12 * s));
    [30, 210].forEach((deg, i) => { const a = deg * Math.PI / 180, dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir), k = new THREE.Group(), puck = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.11, 24), mat(0x111216, { r: 0.4, m: 0.6 })), rg = mesh(new THREE.TorusGeometry(0.13, 0.026, 10, 28).rotateX(Math.PI / 2), mat(METAL, { r: 0.3, m: 0.9 })), dot = mesh(new THREE.SphereGeometry(0.04, 12, 8), mat(0x05070a, { r: 0.3, ec: ACCENT, e: 0.5 })); dot.position.y = 0.06; k.add(puck, rg, dot); k.quaternion.copy(q);
      add(g, nm('mic') + i, 'Microphone', 'mic', s, [k], V(0.5 * dir.x, 0.38, 0.5 * dir.z), V(1.5 * dir.x, 2.5 + i * 0.2, 1.5 * dir.z), E(0.4 * s, 0.5, 0.3)) });
  }
  // charging case: opens like a clam and its internals fall away downward
  const cg = new THREE.Group(); cg.position.set(0, -1.5, 0); root.add(cg);
  const lidLed = mesh(new THREE.BoxGeometry(0.5, 0.04, 0.05), mat(ACCENT, { r: 0.3, ec: ACCENT, e: 1.2 })); lidLed.position.set(0, 0.04, 0.9);
  add(cg, 'lid', 'Case lid', 'cap', 0, [mesh(rb(3.0, 0.6, 1.8, 0.26), mat(BLACK2, { r: 0.5, m: 0.2 })), lidLed], V(0, 0.5, 0), V(0, 1.35, 0), E(-0.25, 0, 0));
  const wells = [-0.75, 0.75].map(x => { const w = mesh(new THREE.TorusGeometry(0.5, 0.04, 10, 40).rotateX(Math.PI / 2), mat(BLUE, { r: 0.4, m: 0.5, ec: BLUE, e: 0.45 })); w.position.set(x, 0.05, 0); return w });
  add(cg, 'tray', 'Earbud tray', 'structure', 0, [mesh(new THREE.BoxGeometry(2.6, 0.08, 1.5), mat(0x101114, { r: 0.6, m: 0.2 })), ...wells], V(0, 0.12, 0), V(0, 0.5, 0));
  const cpb = mesh(new THREE.BoxGeometry(2.2, 0.05, 1.2), mat(0x0a2a22, { r: 0.45, m: 0.3 })); const cchip = (x: number, z: number, w: number, d: number) => { const c = mesh(new THREE.BoxGeometry(w, 0.06, d), mat(0x0a0b0e, { r: 0.3, m: 0.4 })); c.position.set(x, 0.05, z); return c };
  add(cg, 'casepcb', 'Charging board', 'pcb', 0, [cpb, cchip(-0.5, 0.1, 0.4, 0.4), cchip(0.4, -0.2, 0.3, 0.25), cchip(0.6, 0.3, 0.2, 0.15)], V(0, -0.12, 0), V(0, -0.4, 0));
  add(cg, 'casebattery', 'Case battery', 'structure', 0, [mesh(rb(1.7, 0.3, 0.9, 0.08), mat(0x3a3f4a, { r: 0.4, m: 0.7 }))], V(0, -0.28, 0), V(0, -1.2, 0));
  add(cg, 'casecoil', 'Charging coil', 'pcb', 0, [mesh(new THREE.TorusGeometry(0.7, 0.05, 10, 56).rotateX(Math.PI / 2), mat(0xb87333, { r: 0.35, m: 0.9 }))], V(0, -0.42, 0), V(0, -2.0, 0));
  add(cg, 'casebase', 'Case base', 'structure', 0, [mesh(rb(3.0, 0.75, 1.8, 0.28), mat(BLACK, { r: 0.55, m: 0.15 }))], V(0, -0.2, 0), V(0, -3.0, 0));
  return { root, parts, frames, tilts };
}
