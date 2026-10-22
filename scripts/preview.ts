// CPU rasteriser: renders the procedural headphones at several scroll positions to a PNG so the model can be inspected without WebGL.
import * as THREE from 'three';
import fs from 'node:fs';
import { applyExplosion, applyHighlight } from '../src/models/common';
import { buildFit, cameraFor, FOV } from '../src/camera';
import { PRODUCTS, byId } from '../src/products';
import { trap } from '../src/story';
export function render(pid: string, p: number, W = 640, H = 360) {
  const pr = byId(pid), m = pr.build(), aspect = W / H, fit = buildFit(m, aspect, pr.view), c = cameraFor(p, fit, pr.view); applyExplosion(m, c.e, c.spread); applyHighlight(m, trap(p, 0.38, 0.46, 0.62, 0.7), trap(p, 0.62, 0.7, 0.82, 0.88));
  m.root.updateMatrixWorld(true);
  const cam = new THREE.PerspectiveCamera(FOV, aspect, 0.1, 100); cam.position.copy(c.pos); cam.lookAt(c.target); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  const img = new Float32Array(W * H * 3).fill(5 / 255), zb = new Float32Array(W * H).fill(Infinity), vp = new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
  const lights: [THREE.Vector3, THREE.Color, number][] = [[new THREE.Vector3(-0.5, 0.8, 0.7).normalize(), new THREE.Color(1, 1, 1), 0.75], [new THREE.Vector3(0.8, 0.3, -0.6).normalize(), new THREE.Color(0x0050ff), 1.6], [new THREE.Vector3(-0.8, 0.2, -0.5).normalize(), new THREE.Color(0x00d6ff), 1.1]];
  const camPos = cam.position;
  m.root.traverse(o => {
    const me = o as THREE.Mesh; if (!me.isMesh) return; const g = me.geometry as THREE.BufferGeometry, pos = g.attributes.position, nor = g.attributes.normal, idx = g.index, mt = me.material as THREE.MeshStandardMaterial;
    const nm = new THREE.Matrix3().getNormalMatrix(me.matrixWorld), wp: THREE.Vector3[] = [], wn: THREE.Vector3[] = [], sc: THREE.Vector4[] = [];
    for (let i = 0; i < pos.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(me.matrixWorld); wp.push(v); wn.push(new THREE.Vector3().fromBufferAttribute(nor, i).applyMatrix3(nm).normalize()); const h = new THREE.Vector4(v.x, v.y, v.z, 1).applyMatrix4(vp); sc.push(h) }
    const tri = idx ? idx.count / 3 : pos.count / 3;
    for (let t = 0; t < tri; t++) {
      const ia = idx ? idx.getX(t * 3) : t * 3, ib = idx ? idx.getX(t * 3 + 1) : t * 3 + 1, ic = idx ? idx.getX(t * 3 + 2) : t * 3 + 2, A = sc[ia], B = sc[ib], C = sc[ic];
      if (A.w <= 0.01 || B.w <= 0.01 || C.w <= 0.01) continue;
      const pts = [A, B, C].map(h => [(h.x / h.w * 0.5 + 0.5) * W, (1 - (h.y / h.w * 0.5 + 0.5)) * H, h.z / h.w]);
      const minX = Math.max(0, Math.floor(Math.min(pts[0][0], pts[1][0], pts[2][0]))), maxX = Math.min(W - 1, Math.ceil(Math.max(pts[0][0], pts[1][0], pts[2][0]))), minY = Math.max(0, Math.floor(Math.min(pts[0][1], pts[1][1], pts[2][1]))), maxY = Math.min(H - 1, Math.ceil(Math.max(pts[0][1], pts[1][1], pts[2][1])));
      const d = (pts[1][1] - pts[2][1]) * (pts[0][0] - pts[2][0]) + (pts[2][0] - pts[1][0]) * (pts[0][1] - pts[2][1]); if (Math.abs(d) < 1e-9) continue;
      for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
        const l1 = ((pts[1][1] - pts[2][1]) * (x + 0.5 - pts[2][0]) + (pts[2][0] - pts[1][0]) * (y + 0.5 - pts[2][1])) / d, l2 = ((pts[2][1] - pts[0][1]) * (x + 0.5 - pts[2][0]) + (pts[0][0] - pts[2][0]) * (y + 0.5 - pts[2][1])) / d, l3 = 1 - l1 - l2;
        if (l1 < 0 || l2 < 0 || l3 < 0) continue; const z = l1 * pts[0][2] + l2 * pts[1][2] + l3 * pts[2][2]; if (z >= zb[y * W + x]) continue; zb[y * W + x] = z;
        const n = new THREE.Vector3().addScaledVector(wn[ia], l1).addScaledVector(wn[ib], l2).addScaledVector(wn[ic], l3).normalize(), P = new THREE.Vector3().addScaledVector(wp[ia], l1).addScaledVector(wp[ib], l2).addScaledVector(wp[ic], l3), vdir = camPos.clone().sub(P).normalize(); if (n.dot(vdir) < 0) n.negate();
        const col = new THREE.Color(0.02, 0.022, 0.03); for (const [ld, lc, k] of lights) { const dif = Math.max(0, n.dot(ld)); col.r += mt.color.r * lc.r * dif * k * 0.9; col.g += mt.color.g * lc.g * dif * k * 0.9; col.b += mt.color.b * lc.b * dif * k * 0.9; const h = ld.clone().add(vdir).normalize(), sp = Math.pow(Math.max(0, n.dot(h)), 20 + (1 - mt.roughness) * 90) * (0.1 + mt.metalness * 0.9) * k * 0.5; col.r += lc.r * sp; col.g += lc.g * sp; col.b += lc.b * sp }
        const rim = Math.pow(1 - Math.abs(n.dot(vdir)), 3) * 0.55; col.r += 0.0 + rim * 0.1; col.g += rim * 0.45; col.b += rim * 0.9; col.r += mt.emissive.r * mt.emissiveIntensity; col.g += mt.emissive.g * mt.emissiveIntensity; col.b += mt.emissive.b * mt.emissiveIntensity;
        const o2 = (y * W + x) * 3; img[o2] = Math.min(1, col.r); img[o2 + 1] = Math.min(1, col.g); img[o2 + 2] = Math.min(1, col.b);
      }
    }
  });
  return img;
}
if (process.argv[1].endsWith('preview.ts')) {
  const id = process.argv[2] || 'wh-1000xm6', W = 640, H = 360, ps = [0, 0.2, 0.32, 0.55, 0.75, 1.0], tiles = ps.map(p => render(id, p, W, H)), cols = 2, rows = 3, out = Buffer.alloc(W * cols * H * rows * 3);
  tiles.forEach((img, i) => { const ox = (i % cols) * W, oy = Math.floor(i / cols) * H; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) for (let c = 0; c < 3; c++) out[((oy + y) * W * cols + ox + x) * 3 + c] = Math.round(Math.pow(img[(y * W + x) * 3 + c], 1 / 2.2) * 255) });
  fs.writeFileSync(`/tmp/prev-${id}.ppm`, Buffer.concat([Buffer.from(`P6\n${W * cols} ${H * rows}\n255\n`), out])); console.log('wrote', id, PRODUCTS.length);
}
