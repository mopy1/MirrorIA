// Código corto de una reserva: los primeros 8 caracteres del id, en
// mayúsculas. Es el mismo que muestra el Pase de Tienda del celular y el que
// la clienta le dicta al cajero; el panel admin busca por él.

export function codigoReserva(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

/** Acepta lo que escriba el cajero: con o sin "#", espacios o minúsculas. */
export function coincideCodigo(id: string, busqueda: string): boolean {
  const limpio = busqueda.replace(/[#\s]/g, "").toUpperCase();
  return (
    limpio === "" ||
    id.toUpperCase().replace(/-/g, "").startsWith(limpio.replace(/-/g, ""))
  );
}
