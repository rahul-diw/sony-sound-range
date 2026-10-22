import * as THREE from 'three';
export type Tag = 'structure' | 'mic' | 'pcb' | 'driver' | 'cushion' | 'band' | 'cap';
/** One movable piece. Tags drive the story highlights: mic+pcb light up in the 2nd feature beat, driver in the sound beat. */
export interface Part { name: string; label: string; tag: Tag; side: -1 | 0 | 1; pivot: THREE.Group; base: THREE.Vector3; exp: THREE.Vector3; rot: THREE.Euler; mats: THREE.MeshStandardMaterial[]; scaleX?: number }
/** frames: whole sub-assemblies that drift between two positions; tilts: groups that are rotated for composition (tests unrotate them to check collisions in a flat layout). */
export interface Model { root: THREE.Group; parts: Part[]; frames: { g: THREE.Group; base: THREE.Vector3; exp: THREE.Vector3 }[]; tilts?: THREE.Group[] }
export const ACCENT = 0x00d6ff, BLUE = 0x0050ff;
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z), E = (x = 0, y = 0, z = 0) => new THREE.Euler(x, y, z);
export const mat = (color: number, o: { r?: number; m?: number; ec?: number; e?: number } = {}) => { const m = new THREE.MeshStandardMaterial({ color, roughness: o.r ?? 0.6, metalness: o.m ?? 0.1, side: THREE.DoubleSide }); if (o.ec !== undefined) { m.emissive = new THREE.Color(o.ec); m.emissiveIntensity = o.e ?? 1 } m.userData.base = new THREE.Color(color); m.userData.e0 = m.emissiveIntensity; m.userData.ec0 = m.emissive.clone(); return m };
export const lathe = (pts: [number, number][], seg = 72) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);
export const mesh = (g: THREE.BufferGeometry, m: THREE.Material) => new THREE.Mesh(g, m);
export const adder = (parts: Part[]) => (parent: THREE.Object3D, name: string, label: string, tag: Tag, side: -1 | 0 | 1, kids: THREE.Object3D[], base: THREE.Vector3, exp: THREE.Vector3, rot = E(), scaleX?: number) => {
  const pivot = new THREE.Group(); pivot.name = name; kids.forEach(k => pivot.add(k)); pivot.position.copy(base); parent.add(pivot);
  const mats = new Set<THREE.MeshStandardMaterial>(); pivot.traverse(o => { const m = (o as THREE.Mesh).material; if (m) mats.add(m as THREE.MeshStandardMaterial) });
  parts.push({ name, label, tag, side, pivot, base, exp, rot, mats: [...mats], scaleX }); return pivot;
};
/** Positions every part for explosion amount e (0 assembled .. 1 exploded). spread < 1 tightens the diagram on narrow screens. */
export function applyExplosion(m: Model, e: number, spread = 1) {
  const k = e * spread;
  for (const p of m.parts) { p.pivot.position.copy(p.base).lerp(p.exp, k); p.pivot.rotation.set(p.rot.x * e, p.rot.y * e, p.rot.z * e); if (p.scaleX) p.pivot.scale.x = 1 + (p.scaleX - 1) * k }
  for (const f of m.frames) f.g.position.copy(f.base).lerp(f.exp, k);
  m.root.updateMatrixWorld(true);
}
const ACC = new THREE.Color(ACCENT), BLU = new THREE.Color(BLUE);
/** Lights up microphone/board parts (a) and driver parts (b), dimming the rest, as the story moves between beats. */
export function applyHighlight(m: Model, a: number, b: number) {
  const dim = Math.max(a, b);
  for (const p of m.parts) {
    const hot = (p.tag === 'mic' || p.tag === 'pcb') ? a : p.tag === 'driver' ? b : 0;
    for (const mt of p.mats) {
      mt.color.copy(mt.userData.base).multiplyScalar(1 - 0.55 * dim * (1 - hot)).lerp(hot > 0 ? (p.tag === 'driver' ? BLU : ACC) : mt.userData.base, 0.18 * hot);
      const base = mt.userData.e0 as number, c0 = mt.userData.ec0 as THREE.Color;
      if (hot > 0) { mt.emissive.copy(c0.r + c0.g + c0.b > 0 ? c0 : (p.tag === 'driver' ? BLU : ACC)); mt.emissiveIntensity = base + hot * (p.tag === 'mic' ? 2.2 : p.tag === 'driver' ? 0.9 : 0.8) } else { mt.emissive.copy(c0); mt.emissiveIntensity = base }
    }
  }
}
/** A speaker/earbud driver: cone, rubber surround, metal frame and dust cap. Axis = local +Y (outward). */
export function makeDriver(r: number, tone = 0x2a2c33) {
  const g = new THREE.Group();
  g.add(mesh(lathe([[r * 0.2, -0.02], [r * 0.55, 0.05], [r * 0.95, 0.1], [r, 0.1], [r * 0.95, 0.08], [r * 0.55, 0.02], [r * 0.2, -0.04]]), mat(tone, { r: 0.55, m: 0.3 })));
  g.add(mesh(new THREE.TorusGeometry(r * 0.98, r * 0.07, 12, 64).rotateX(Math.PI / 2), mat(0x24262d, { r: 0.8 })));
  g.add(mesh(new THREE.TorusGeometry(r * 1.18, r * 0.09, 12, 64).rotateX(Math.PI / 2), mat(0x2b2f3a, { r: 0.35, m: 0.85 })));
  g.add(mesh(new THREE.SphereGeometry(r * 0.22, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x34373f, { r: 0.5, m: 0.5 })));
  return g;
}
/** Four-walled-plus-back open box (hollow, open toward +Z) so internals are visible once it moves away. */
export function hollowBox(w: number, h: number, d: number, t: number, m: THREE.Material) {
  const g = new THREE.Group(), box = (bw: number, bh: number, bd: number, x: number, y: number, z: number) => { const b = mesh(new THREE.BoxGeometry(bw, bh, bd), m); b.position.set(x, y, z); g.add(b) };
  box(w, h, t, 0, 0, -d / 2 + t / 2); box(w, t, d, 0, h / 2 - t / 2, 0); box(w, t, d, 0, -h / 2 + t / 2, 0); box(t, h, d, -w / 2 + t / 2, 0, 0); box(t, h, d, w / 2 - t / 2, 0, 0); return g;
}
