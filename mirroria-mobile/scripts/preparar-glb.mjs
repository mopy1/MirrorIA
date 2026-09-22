#!/usr/bin/env node
/**
 * Deja un `.glb` descargado en condiciones de entrar al Vestidor 3D, y lo
 * verifica. Una sola orden de punta a punta.
 *
 *   node scripts/preparar-glb.mjs entrada.glb [salida.glb] [--triangulos N]
 *
 * Los modelos de prenda que se consiguen (Style3D en Sketchfab, por ejemplo)
 * son salida de CAD de simulacion: 140k-390k triangulos y hasta 5 mapas de
 * textura. Los dos que funcionan en la app tienen 21k y 37k.
 *
 * Dos banderas que NO son el default y hacen falta:
 *  - `--compress false`: `optimize` comprime con DRACO por defecto, y
 *    `GarmentModel` usa `GLTFLoader().parse()` SIN `DRACOLoader`. Probado:
 *    un glb con Draco muere con "No DRACOLoader instance provided".
 *  - texturas a webp y no KTX2: KTX2 pediria `KTX2Loader`, que no esta
 *    montado. Medido: webp deja el waist_trainer en 0,83 MB contra 3,31 solo
 *    redimensionando, y Android decodifica webp nativo.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const OBJETIVO_POR_DEFECTO = 35000;
const MAX_MB = 4;
const EN_WINDOWS = process.platform === 'win32';

function fallar(msg) {
  console.error(`\n  ERROR: ${msg}\n`);
  process.exit(1);
}

// ---------------------------------------------------------------- argumentos

const argv = process.argv.slice(2);
if (argv.length === 0 || argv.includes('-h') || argv.includes('--help')) {
  console.log(`
  node scripts/preparar-glb.mjs entrada.glb [salida.glb] [opciones]

    --triangulos N   objetivo de triangulos (por defecto ${OBJETIVO_POR_DEFECTO.toLocaleString()})
    --sin-verificar  no correr verificar-glb.py al terminar

  Sin salida.glb, escribe "<entrada>-listo.glb" al lado de la entrada.
`);
  process.exit(argv.length === 0 ? 2 : 0);
}

const posicionales = [];
let objetivo = OBJETIVO_POR_DEFECTO;
let verificar = true;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--triangulos') objetivo = Number(argv[++i]);
  else if (argv[i] === '--sin-verificar') verificar = false;
  else posicionales.push(argv[i]);
}

if (!Number.isFinite(objetivo) || objetivo < 1000) {
  fallar(`--triangulos tiene que ser un numero razonable, llego "${objetivo}"`);
}

const entrada = resolve(posicionales[0]);
const salida = resolve(posicionales[1] ?? entrada.replace(/\.glb$/i, '') + '-listo.glb');

if (!existsSync(entrada)) fallar(`no existe el archivo: ${entrada}`);
if (entrada === salida) fallar('la salida no puede ser el mismo archivo que la entrada');

// ------------------------------------------------------------------ medicion

/** Lee el JSON del glb sin dependencias. */
function medir(ruta) {
  const d = readFileSync(ruta);
  if (d.subarray(0, 4).toString() !== 'glTF') {
    fallar(`${basename(ruta)} no es un .glb binario (un .gltf de texto hay que convertirlo primero)`);
  }
  let off = 12;
  let js = null;
  while (off < d.length) {
    const ln = d.readUInt32LE(off);
    const ty = d.readUInt32LE(off + 4);
    if (ty === 0x4e4f534a) js = JSON.parse(d.subarray(off + 8, off + 8 + ln).toString('utf8'));
    off += 8 + ln;
  }
  let tris = 0;
  for (const m of js.meshes ?? []) {
    for (const p of m.primitives ?? []) {
      if (p.indices != null) tris += Math.floor(js.accessors[p.indices].count / 3);
    }
  }
  const ext = js.extensionsUsed ?? [];
  return {
    tris,
    mb: statSync(ruta).size / 1048576,
    texturas: (js.textures ?? []).length,
    huesos: (js.skins ?? []).length,
    animaciones: (js.animations ?? []).length,
    draco: ext.some((e) => /draco/i.test(e)),
  };
}

const fmt = (m) =>
  `${m.tris.toLocaleString()} triangulos, ${m.mb.toFixed(2)} MB, ${m.texturas} textura(s)`;

// --------------------------------------------------- comprobaciones de entrada

const antes = medir(entrada);
console.log(`entrada : ${fmt(antes)}`);

if (antes.draco) {
  fallar(
    'la ENTRADA ya viene con Draco. Hay que conseguirla sin comprimir:\n' +
      '  sin el decodificador no se puede descomprimir, y la app tampoco la abre.',
  );
}
if (antes.huesos || antes.animaciones) {
  console.log(
    `  aviso  : trae ${antes.huesos} esqueleto(s) y ${antes.animaciones} animacion(es);` +
      ' el Vestidor no las usa y se van a descartar.',
  );
}

const python = ['python', 'python3', 'py'].find(
  (c) => spawnSync(c, ['--version'], { shell: EN_WINDOWS }).status === 0,
);

// Chequear los HOMBROS antes de decimar: si el modelo tiene cabeza, maniqui o
// percha, el anclaje no va a funcionar NUNCA y decimar es tiempo perdido.
if (verificar && python) {
  const previo = spawnSync(python, [join(AQUI, 'verificar-glb.py'), entrada], {
    encoding: 'utf8',
    shell: EN_WINDOWS,
  });
  const problemaDeForma = (previo.stdout ?? '')
    .split('\n')
    .find((l) => l.includes('[X]') && l.includes('8%'));
  if (problemaDeForma) {
    console.error('\n  La ENTRADA no sirve para el Vestidor, y decimarla no lo arregla:');
    console.error(`  ${problemaDeForma.trim()}`);
    console.error('\n  Hace falta la PRENDA SOLA, sin cabeza, maniqui ni percha.\n');
    process.exit(1);
  }
}

// ------------------------------------------------------------------ optimizar

const ratio = Math.min(1, objetivo / Math.max(1, antes.tris));
const hayQueSimplificar = antes.tris > objetivo;
console.log(
  hayQueSimplificar
    ? `objetivo: ${objetivo.toLocaleString()} triangulos  (ratio ${ratio.toFixed(3)})`
    : `objetivo: ya esta por debajo de ${objetivo.toLocaleString()}; solo se tocan las texturas`,
);

const cli = join(AQUI, '..', 'node_modules', '.bin', 'gltf-transform');
const flags = [
  'optimize',
  entrada,
  salida,
  '--compress',
  'false',
  '--texture-compress',
  'webp',
  '--texture-size',
  '1024',
  '--simplify',
  String(hayQueSimplificar),
];
if (hayQueSimplificar) {
  flags.push('--simplify-ratio', String(ratio), '--simplify-error', '0.005');
}

try {
  execFileSync(cli, flags, { stdio: ['ignore', 'pipe', 'inherit'], shell: EN_WINDOWS });
} catch {
  fallar('gltf-transform fallo. Si dice que no lo encuentra, correr `npm install` en mirroria-mobile.');
}

// -------------------------------------------------------------------- informe

const despues = medir(salida);
const aliviado = (100 - (despues.mb / antes.mb) * 100).toFixed(0);
console.log(`salida  : ${fmt(despues)}  (${aliviado}% mas liviano)`);

if (despues.draco) {
  fallar('la salida quedo con Draco — la app no la va a abrir. Revisar --compress.');
}

let problemas = 0;
if (despues.tris > objetivo * 1.15) {
  console.log(
    `  aviso  : quedo en ${despues.tris.toLocaleString()}, por encima del objetivo.` +
      ' meshoptimizer para cuando el error pasa la tolerancia; si molesta, subir --simplify-error.',
  );
}
if (despues.mb > MAX_MB) {
  console.error(`  [X] ${despues.mb.toFixed(2)} MB supera los ${MAX_MB} MB: se descarga por prenda.`);
  problemas++;
}

// ------------------------------------------------------------------ verificar

if (verificar) {
  if (!python) {
    console.log('\n  aviso: no se encontro python; verificar a mano con scripts/verificar-glb.py');
  } else {
    console.log();
    const r = spawnSync(python, [join(AQUI, 'verificar-glb.py'), salida], {
      stdio: 'inherit',
      shell: EN_WINDOWS,
    });
    if (r.status !== 0) problemas++;
  }
}

if (problemas > 0) {
  console.error('\n  El archivo NO esta listo para cargar.\n');
  process.exit(1);
}
console.log(`\n  Listo: ${salida}`);
console.log('  Subilo y pega su URL en "Modelo 3D para Vestidor AR (.glb)" del panel admin.\n');
