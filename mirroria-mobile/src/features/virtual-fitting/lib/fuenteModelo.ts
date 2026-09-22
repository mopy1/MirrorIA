/**
 * De dónde sale el `.glb` que carga el Vestidor 3D.
 *
 * `local` es un modelo empaquetado dentro del APK (lo que devuelve
 * `require('...glb')`, un número); `remoto` es el `modeloArUrl` que el admin
 * le cargó al producto y hay que descargar en caliente.
 */
export type FuenteModelo =
  | { tipo: 'local'; modulo: number }
  | { tipo: 'remoto'; url: string };

const EXTENSIONES = ['.glb', '.gltf'];

/**
 * Decide qué modelo mostrar para la prenda elegida.
 *
 * Cae al modelo empaquetado siempre que la URL no sirva, en vez de dejar el
 * visor en error: `GLTFLoader.parse()` sobre algo que no es un glb lanza una
 * excepción cruda, y el caso más probable es un admin pegando el PNG de
 * overlay en el campo del modelo 3D.
 */
export function resolverFuenteModelo(
  modeloArUrl: string | null | undefined,
  moduloDeRespaldo: number,
): FuenteModelo {
  const local: FuenteModelo = { tipo: 'local', modulo: moduloDeRespaldo };
  const url = modeloArUrl?.trim();
  if (!url) return local;

  let ruta: string;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return local;
    // Sin query ni fragmento: las URL firmadas (Vercel Blob, S3) traen el
    // token pegado y mirar el final de la cadena a secas dejaría afuera un
    // .glb perfectamente válido.
    ruta = parsed.pathname;
  } catch {
    return local;
  }

  const enMinusculas = ruta.toLowerCase();
  if (!EXTENSIONES.some((ext) => enMinusculas.endsWith(ext))) return local;

  return { tipo: 'remoto', url };
}
