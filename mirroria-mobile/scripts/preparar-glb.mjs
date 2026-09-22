#!/usr/bin/env node
/**
 * Deja un `.glb` descargado en condiciones de entrar al Vestidor 3D.
 *
 * Los modelos de prenda que se consiguen (Style3D en Sketchfab, por ejemplo)
 * son salida de CAD de simulacion: 140k-390k triangulos y hasta 5 mapas de
 * textura. Los dos que funcionan en la app tienen 21k y 37k. Este script
 * hace el recorte con meshoptimizer y achica las texturas.
 *
 * Uso:  node scripts/preparar-glb.mjs entrada.glb salida.glb [triangulos]
 *
 * OJO: NO comprime con Draco (`--compress false`). `GarmentModel` usa
 * `GLTFLoader().parse()` sin `DRACOLoader`, asi que un glb con Draco no abre.
 * Tampoco usa KTX2 por lo mismo: haria falta `KTX2Loader`, que no esta.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';

const [entrada, salida, objetivoArg] = process.argv.slice(2);
if (!entrada || !salida) {
  console.error('uso: node scripts/preparar-glb.mjs entrada.glb salida.glb [triangulos]');
  process.exit(2);
}
const OBJETIVO = Number(objetivoArg ?? 35000);

/** Cuenta triangulos leyendo el JSON del glb, sin dependencias. */
function contar(ruta) {
  const d = readFileSync(ruta);
  let off = 12, js = null;
  while (off < d.length) {
    const ln = d.readUInt32LE(off), ty = d.readUInt32LE(off + 4);
    if (ty === 0x4e4f534a) js = JSON.parse(d.subarray(off + 8, off + 8 + ln).toString('utf8'));
    off += 8 + ln;
  }
  let tris = 0;
  for (const m of js.meshes ?? [])
    for (const p of m.primitives ?? [])
      if (p.indices != null) tris += Math.floor(js.accessors[p.indices].count / 3);
  return { tris, mb: statSync(ruta).size / 1048576, draco: (js.extensionsUsed ?? []).some(e => /draco/i.test(e)) };
}

const antes = contar(entrada);
const ratio = Math.min(1, OBJETIVO / Math.max(1, antes.tris));
console.log(`entrada : ${antes.tris.toLocaleString()} triangulos, ${antes.mb.toFixed(2)} MB`);
console.log(`objetivo: ${OBJETIVO.toLocaleString()} triangulos  (ratio ${ratio.toFixed(3)})`);

execFileSync('npx', ['--yes', '@gltf-transform/cli@4', 'optimize', entrada, salida,
  '--compress', 'false',        // NADA de Draco: GLTFLoader.parse() sin DRACOLoader no lo abre
  '--texture-compress', 'webp', // webp lo lee three.js; KTX2 necesitaria KTX2Loader
  '--texture-size', '1024',
  '--simplify', 'true',
  '--simplify-ratio', String(ratio),
  '--simplify-error', '0.005',
], { stdio: ['ignore', 'pipe', 'inherit'], shell: process.platform === 'win32' });

const despues = contar(salida);
console.log(`salida  : ${despues.tris.toLocaleString()} triangulos, ${despues.mb.toFixed(2)} MB` +
            `  (${(100 - despues.mb / antes.mb * 100).toFixed(0)}% mas liviano)`);
if (despues.draco) { console.error('ERROR: la salida quedo con Draco — no va a abrir en la app'); process.exit(1); }
console.log('\nAhora verificalo:  python scripts/verificar-glb.py ' + salida);
