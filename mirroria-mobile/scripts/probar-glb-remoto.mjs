/**
 * Ejercita la MISMA cadena que GarmentModel hace con un modeloArUrl:
 * servidor HTTP -> descarga -> GLTFLoader.parse(arrayBuffer) -> medir hombros.
 * Usa el three.js exacto del proyecto movil.
 *
 * Uso:  node scripts/probar-glb-remoto.mjs modelo.glb
 *
 * Sirve para dos cosas antes de subir un modelo a ningun lado:
 *  - confirmar que el archivo PARSEA (un glb con Draco muere aca con
 *    "No DRACOLoader instance provided", igual que moriria en la app);
 *  - confirmar que se le encuentran los hombros al 8% desde arriba, que es
 *    de donde sale el anclaje de la prenda.
 *
 * LIMITE CONOCIDO: un modelo CON TEXTURAS falla aca con "self is not
 * defined". NO es un problema del modelo ni de la app: es que Node no tiene
 * decodificador de imagenes, y en React Native @react-three/fiber trae su
 * propio polyfill de TextureLoader en su entry point "react-native". Para un
 * modelo con texturas, usar `verificar-glb.py`, que no depende de three.
 */
import http from 'node:http';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const archivo = process.argv[2];
const bytes = readFileSync(archivo);

const server = http.createServer((req, res) => {
  if (req.url.endsWith('.glb')) {
    res.writeHead(200, { 'Content-Type': 'model/gltf-binary', 'Content-Length': bytes.length });
    res.end(bytes);
  } else { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/vestido.glb`;
console.log(`1. sirviendo  ${url}`);

const resp = await fetch(url);
console.log(`2. descarga   HTTP ${resp.status}, ${resp.headers.get('content-type')}`);
const arrayBuffer = await resp.arrayBuffer();
console.log(`3. bytes      ${arrayBuffer.byteLength.toLocaleString()}`);

const gltf = await new Promise((resolve, reject) =>
  new GLTFLoader().parse(arrayBuffer, '', resolve, reject));
console.log(`4. parse      OK`);

// Lo mismo que measureShoulderCrossSection de GarmentModel.tsx
const box = new THREE.Box3().setFromObject(gltf.scene);
const alto = box.max.y - box.min.y;
const objetivo = box.max.y - alto * 0.08;
const banda = alto * 0.03;
let minX = Infinity, maxX = -Infinity, total = 0;
const v = new THREE.Vector3();
gltf.scene.traverse((o) => {
  if (!o.isMesh) return;
  const pos = o.geometry?.attributes?.position;
  if (!pos) return;
  total += pos.count;
  for (let i = 0; i < pos.count; i++) {
    v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    o.localToWorld(v);
    if (Math.abs(v.y - objetivo) > banda) continue;
    if (v.x < minX) minX = v.x;
    if (v.x > maxX) maxX = v.x;
  }
});
const ok = maxX !== -Infinity;
console.log(`5. hombros    ${ok ? `ancho ${(maxX - minX).toFixed(3)} sobre ${total.toLocaleString()} vertices` : 'NO SE MIDIERON (caeria al respaldo: ancho TOTAL)'}`);
console.log(ok ? '\n   OK: la cadena remota completa funciona' : '\n   FALLA');
server.close();
process.exit(ok ? 0 : 1);
