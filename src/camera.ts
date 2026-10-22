import * as THREE from 'three';
import { applyExplosion, type Model } from './models/common';
import { explosion, clamp, smooth, beat } from './story';
export const FOV = 30;
/** soundRight: the sound-beat copy sits on the right (so its callouts go left). */
export interface View { yaw: [number, number]; pitch: [number, number]; soundRight?: boolean }
/** Spread multiplier: tighter exploded diagram on portrait screens so everything stays in frame. */
export const spreadFor = (aspect: number) => clamp(aspect / 1.25, 0.55, 1);
export interface Fit { aspect: number; spread: number; dist: number[]; center: THREE.Vector3[]; h0: number }
const N = 24, dirOf = (yaw: number, pitch: number) => new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
const eachVertex = (m: Model, fn: (v: THREE.Vector3) => void) => { const v = new THREE.Vector3(); m.root.traverse(o => { const me = o as THREE.Mesh; if (!me.isMesh) return; const pos = me.geometry.attributes.position, step = Math.max(1, Math.floor(pos.count / 300)); for (let k = 0; k < pos.count; k += step) fn(v.fromBufferAttribute(pos, k).applyMatrix4(me.matrixWorld)) }) };
/** Exact camera distance for every explosion amount: the smallest distance at which every vertex stays inside the frame, for this model, aspect and view. */
export function buildFit(model: Model, aspect: number, view: View): Fit {
  const sp = spreadFor(aspect), tan = Math.tan((FOV / 2) * Math.PI / 180), dist: number[] = [], center: THREE.Vector3[] = []; let h0 = 1;
  for (let i = 0; i <= N; i++) {
    const e = i / N; applyExplosion(model, e, sp); const mn = new THREE.Vector3(1e9, 1e9, 1e9), mx = new THREE.Vector3(-1e9, -1e9, -1e9); eachVertex(model, v => { mn.min(v); mx.max(v) });
    const c = mn.clone().add(mx).multiplyScalar(0.5); if (i === 0) h0 = mx.y - mn.y;
    const yaw = (view.yaw[0] + (view.yaw[1] - view.yaw[0]) * e) * Math.PI / 180, pitch = (view.pitch[0] + (view.pitch[1] - view.pitch[0]) * e) * Math.PI / 180, d = dirOf(yaw, pitch), right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)), up = new THREE.Vector3().crossVectors(d, right), m = 0.7 + 0.12 * e; let need = 1;
    eachVertex(model, v => { const r = v.clone().sub(c), z = r.dot(d); need = Math.max(need, z + Math.abs(r.dot(right)) / (m * tan * aspect), z + Math.abs(r.dot(up)) / (m * tan)) });
    dist.push(need); center.push(c);
  }
  applyExplosion(model, 0, 1); return { aspect, spread: sp, dist, center, h0 };
}
/** Camera for scroll progress p: a three-quarter hero angle that swings and pulls back as parts spread, then returns. */
export function cameraFor(p: number, fit: Fit, view: View) {
  const e = explosion(p), f = e * N, i = Math.min(N - 1, Math.floor(f)), t = f - i, dist = fit.dist[i] + (fit.dist[i + 1] - fit.dist[i]) * t, c = fit.center[i].clone().lerp(fit.center[i + 1], t);
  const yaw = (view.yaw[0] + (view.yaw[1] - view.yaw[0]) * e) * Math.PI / 180, pitch = (view.pitch[0] + (view.pitch[1] - view.pitch[0]) * e) * Math.PI / 180;
  const shift = 0.14 * fit.h0 * (1 - e) * (1 - 2 * smooth((p - 0.86) / 0.1)); // product sits low for the headline, then rises for the closing call to action
  const target = c.clone(); target.y += shift;
  // composition: slide the product away from whichever side the copy is on (copy left -> product right)
  const sx = 0.09 * (beat('engineering', p) - beat('noise', p) + (view.soundRight ? -1 : 1) * beat('sound', p)), right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  target.addScaledVector(right, -sx * dist * Math.tan((FOV / 2) * Math.PI / 180) * fit.aspect);
  const pos = dirOf(yaw, pitch).multiplyScalar(dist).add(target);
  return { pos, target, e, spread: fit.spread, sx };
}
