import { createHash } from 'node:crypto';

/**
 * Genera un hash SHA-256 canónico del cuerpo de la solicitud JSON.
 * Ordena recursivamente las claves de los objetos para que el hash sea
 * determinista e independiente del orden de las propiedades en el payload.
 */
export function calcularHashCuerpo(body: unknown): string {
  if (!body || (typeof body === 'object' && Object.keys(body).length === 0)) {
    return createHash('sha256').update('').digest('hex');
  }
  const canonico = JSON.stringify(ordenarClaves(body));
  return createHash('sha256').update(canonico).digest('hex');
}

function ordenarClaves(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(ordenarClaves);
  return Object.keys(obj)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = ordenarClaves((obj as Record<string, unknown>)[key]);
      return acc;
    }, {});
}
