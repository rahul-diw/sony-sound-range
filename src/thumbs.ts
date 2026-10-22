import * as THREE from 'three';
import { applyExplosion } from './models/common';
import { buildFit, cameraFor, FOV } from './camera';
import { setupRenderer, setupScene, disposeModel } from './lighting';
import type { Product } from './products';
/** Renders one still image per product with a temporary WebGL context (used as the card art in "Explore the range"). */
export function renderThumbs(products: Product[], W = 720, H = 480): Record<string, string> {
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H; const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setPixelRatio(1); r.setSize(W, H, false); setupRenderer(r);
  const out: Record<string, string> = {}, scene = new THREE.Scene();
  try {
    setupScene(scene, r); // lighting and reflections are built once and shared by all products
    for (const p of products) {
      const m = p.build(), cam = new THREE.PerspectiveCamera(FOV, W / H, 0.1, 100), fit = buildFit(m, W / H, p.view), c = cameraFor(0.02, fit, p.view);
      applyExplosion(m, 0.0, 1); scene.add(m.root); m.root.updateMatrixWorld(true); cam.position.copy(c.pos); cam.lookAt(c.target); cam.updateMatrixWorld(); r.render(scene, cam); out[p.id] = canvas.toDataURL('image/png'); scene.remove(m.root); disposeModel(m.root);
    }
  } finally { r.dispose(); r.forceContextLoss() }
  return out;
}
