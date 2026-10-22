import * as THREE from 'three';
import { type Part, type Model, adder, V, E, mat, lathe, mesh, ACCENT, BLUE } from './common';
export const CUP_X = 1.62, CUP_OUT = 1.3;
const ELL = 1.16; // ear cups are slightly taller than deep
const PLASTIC = 0x16171b, PLASTIC2 = 0x1d1f26, FABRIC = 0x0f1013, METAL = 0x2b2f3a;

export function makeHeadphones(): Model {
  const root = new THREE.Group(), parts: Part[] = [], frames: Model['frames'] = [], add = adder(parts);
  for (const side of [-1, 1] as const) {
    const s = side, tagName = (n: string) => `${n}${s < 0 ? 'L' : 'R'}`, g = new THREE.Group(); g.position.set(s * CUP_X, 0, 0); g.rotation.z = -s * Math.PI / 2; root.add(g); frames.push({ g, base: V(s * CUP_X, 0, 0), exp: V(s * (CUP_X + CUP_OUT), 0, 0) });
    const ell = <T extends THREE.BufferGeometry>(geo: T) => { geo.scale(ELL, 1, 1); return geo };
    // ear cushion: soft ring, moves toward the head
    add(g, tagName('cushion'), 'Ear cushion', 'cushion', s, [mesh(ell(new THREE.TorusGeometry(0.74, 0.25, 24, 72).rotateX(Math.PI / 2)), mat(FABRIC, { r: 0.92, m: 0 }))], V(0, -0.3, 0), V(0, -1.55, 0), E(0, 0.3 * s, 0));
    // shell: hollow cup so the internals can be seen
    add(g, tagName('shell'), 'Acoustic chamber', 'structure', s, [mesh(ell(lathe([[0, 0.34], [0.7, 0.34], [0.9, 0.27], [0.98, 0.13], [0.98, -0.14], [0.92, -0.2], [0.88, -0.14], [0.88, 0.08], [0.7, 0.27], [0, 0.27]])), mat(PLASTIC, { r: 0.58, m: 0.15 }))], V(0, 0, 0), V(0, 2.3, 0));
    // outer plate with a thin accent ring
    const capRing = mesh(ell(new THREE.TorusGeometry(0.66, 0.018, 12, 96).rotateX(Math.PI / 2)), mat(BLUE, { r: 0.3, m: 0.6, ec: BLUE, e: 0.9 })); capRing.position.y = 0.01;
    add(g, tagName('cap'), 'Outer plate', 'cap', s, [mesh(ell(lathe([[0, 0.07], [0.62, 0.05], [0.72, 0], [0.62, -0.04], [0, -0.04]])), mat(PLASTIC2, { r: 0.5, m: 0.25 })), capRing], V(0, 0.38, 0), V(0, 3.6, 0), E(0, 0.55 * s, 0));
    // driver stack: cone + surround + frame, voice coil, magnet
    const surround = mesh(ell(new THREE.TorusGeometry(0.52, 0.035, 12, 72).rotateX(Math.PI / 2)), mat(0x24262d, { r: 0.8 })), frameRing = mesh(ell(new THREE.TorusGeometry(0.62, 0.05, 12, 72).rotateX(Math.PI / 2)), mat(METAL, { r: 0.35, m: 0.85 })), dust = mesh(new THREE.SphereGeometry(0.11, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x34373f, { r: 0.5, m: 0.5 }));
    add(g, tagName('cone'), 'Driver unit', 'driver', s, [mesh(ell(lathe([[0.1, -0.02], [0.3, 0.05], [0.5, 0.1], [0.53, 0.1], [0.5, 0.08], [0.3, 0.02], [0.1, -0.04]])), mat(0x2a2c33, { r: 0.55, m: 0.3 })), surround, frameRing, dust], V(0, -0.02, 0), V(0, -0.62, 0), E(0, -0.4 * s, 0));
    add(g, tagName('coil'), 'Voice coil', 'driver', s, [mesh(ell(new THREE.TorusGeometry(0.26, 0.03, 12, 64).rotateX(Math.PI / 2)), mat(0xb87333, { r: 0.35, m: 0.9 }))], V(0, 0.05, 0), V(0, 0.02, 0), E(0, 0.3 * s, 0));
    add(g, tagName('magnet'), 'Magnet', 'driver', s, [mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.16, 48), mat(0x3a3e49, { r: 0.3, m: 0.95 })), mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.2, 24), mat(0x15161a, { r: 0.5, m: 0.5 }))], V(0, 0.14, 0), V(0, 0.68, 0), E(0, -0.3 * s, 0));
    // main board with a processor (left) or battery (right)
    const board = mesh(new THREE.BoxGeometry(0.95, 0.04, 0.6), mat(0x0a2a22, { r: 0.45, m: 0.3 })), chips: THREE.Object3D[] = [board];
    const chip = (x: number, z: number, w: number, d: number, em = false) => { const c = mesh(new THREE.BoxGeometry(w, 0.06, d), mat(em ? 0x0a0c10 : 0x0a0b0e, { r: 0.3, m: 0.4, ...(em ? { ec: ACCENT, e: 0.35 } : {}) })); c.position.set(x, 0.05, z); chips.push(c) };
    chip(-0.2, 0.05, 0.3, 0.3, s < 0); chip(0.22, -0.12, 0.2, 0.16); chip(0.2, 0.17, 0.16, 0.12); chip(-0.34, -0.2, 0.12, 0.1);
    add(g, tagName('board'), s < 0 ? 'Processing chip' : 'Control board', 'pcb', s, chips, V(0.06, 0.24, 0), V(0.14, 1.5, 0), E(0, 0, 0.14 * s));
    if (s > 0) add(g, 'battery', 'Battery', 'structure', s, [mesh(new THREE.BoxGeometry(0.8, 0.1, 0.46), mat(0x3a3f4a, { r: 0.4, m: 0.7 })), (() => { const st = mesh(new THREE.BoxGeometry(0.5, 0.012, 0.1), mat(BLUE, { r: 0.4, ec: BLUE, e: 0.5 })); st.position.y = 0.056; return st })()], V(-0.12, 0.31, 0), V(-0.5, 2.0, 0.4), E(0.1, 0, 0));
    // microphone array: three tiny modules around the rim
    [-50, 10, 70].forEach((deg, i) => { // upper arc of the rim; local X points down on the right cup, so flip it with the side
      const a = deg * Math.PI / 180, lx = -s * Math.cos(a) * ELL, dir = new THREE.Vector3(lx, 0, Math.sin(a)).normalize(), q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir);
      const puck = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.13, 28), mat(0x111216, { r: 0.4, m: 0.6 })), ring = mesh(new THREE.TorusGeometry(0.15, 0.03, 12, 32).rotateX(Math.PI / 2), mat(METAL, { r: 0.3, m: 0.9 })), dot = mesh(new THREE.SphereGeometry(0.05, 14, 10), mat(0x05070a, { r: 0.3, ec: ACCENT, e: 0.5 })); dot.position.y = 0.07;
      const k = new THREE.Group(); k.add(puck, ring, dot); k.quaternion.copy(q);
      add(g, `${tagName('mic')}${i}`, 'Microphone array', 'mic', s, [k], V(0.98 * lx, 0.02, 0.98 * Math.sin(a)), V(1.95 * lx, 2.05 + i * 0.25, 1.95 * Math.sin(a)), E(0.4 * s, 0.5, 0.3));
    });
    // slider + hinge between cup and band
    add(root, tagName('slider'), 'Slider arm', 'structure', s, [mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.95, 24), mat(METAL, { r: 0.3, m: 0.9 })), (() => { const c = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 24), mat(PLASTIC2, { r: 0.5, m: 0.3 })); c.position.y = -0.4; return c })()], V(s * CUP_X, 1.58, 0), V(s * (CUP_X + CUP_OUT), 3.1, 0), E(0, 0, 0.1 * s));
    add(root, tagName('yoke'), 'Hinge', 'structure', s, [mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.5, 32).rotateX(Math.PI / 2), mat(PLASTIC2, { r: 0.5, m: 0.35 })), (() => { const b = mesh(new THREE.BoxGeometry(0.2, 0.34, 0.2), mat(PLASTIC, { r: 0.55, m: 0.2 })); b.position.y = 0.2; return b })()], V(s * CUP_X, 1.14, 0), V(s * (CUP_X + CUP_OUT), 1.95, 0), E(0.3, 0, 0.2 * s));
  }
  // headband and its soft pad (half-ellipse tubes)
  const arc = (a: number, b: number, cy: number) => new THREE.CatmullRomCurve3(Array.from({ length: 41 }, (_, i) => { const t = (i / 40) * Math.PI; return new THREE.Vector3(Math.cos(t) * a, cy + Math.sin(t) * b, 0) }));
  const bandGeo = new THREE.TubeGeometry(arc(CUP_X, 1.05, 1.9), 120, 0.15, 16), padGeo = new THREE.TubeGeometry(arc(CUP_X - 0.2, 0.9, 1.84), 120, 0.12, 16);
  bandGeo.scale(1, 1, 1.7); padGeo.scale(1, 1, 1.9);
  add(root, 'band', 'Headband', 'band', 0, [mesh(bandGeo, mat(PLASTIC, { r: 0.6, m: 0.15 }))], V(0, 0, 0), V(0, 2.45, 0), E(-0.06, 0, 0), 1.45);
  add(root, 'pad', 'Headband pad', 'cushion', 0, [mesh(padGeo, mat(FABRIC, { r: 0.92, m: 0 }))], V(0, 0, 0), V(0, 1.2, 0), E(-0.03, 0, 0), 1.35);
  return { root, parts, frames };
}
