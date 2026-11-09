// Código corto: los primeros 8 caracteres del id en mayúsculas. Es el que muestra el Pase de
// Tienda de la clienta y el que dicta en caja (mismo criterio que la web).

export function codigoCorto(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

/** Acepta lo que escriba la cajera: con o sin "#", espacios o minúsculas. */
export function coincideCodigo(id: string, busqueda: string): boolean {
  const limpio = busqueda.replace(/[#\s-]/g, '').toUpperCase();
  return limpio === '' || id.toUpperCase().replace(/-/g, '').startsWith(limpio);
}
