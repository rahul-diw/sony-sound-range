import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
export function setupRenderer(r: THREE.WebGLRenderer) { r.setClearColor(0x000000, 0); r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05; r.outputColorSpace = THREE.SRGBColorSpace }
/** Studio look shared by the main stage and the card thumbnails: soft reflections, white key, blue and cyan rim lights. Returns the accent glow light. */
export function setupScene(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; (scene as any).environmentIntensity = 0.32; pm.dispose();
  const key = new THREE.DirectionalLight(0xffffff, 1.0); key.position.set(-4, 6, 6); const rimB = new THREE.DirectionalLight(0x0050ff, 4.5); rimB.position.set(6, 3, -6); const rimC = new THREE.DirectionalLight(0x00d6ff, 3.2); rimC.position.set(-7, 2, -5);
  const glow = new THREE.PointLight(0x00d6ff, 0, 30, 1.6); glow.position.set(0, 1.6, 3); scene.add(key, rimB, rimC, new THREE.HemisphereLight(0x1a2240, 0x000000, 0.4), glow); return glow;
}
export function disposeModel(root: THREE.Object3D) { root.traverse(o => { const m = o as THREE.Mesh; if (!m.isMesh) return; m.geometry.dispose(); (Array.isArray(m.material) ? m.material : [m.material]).forEach(x => x.dispose()) }) }
