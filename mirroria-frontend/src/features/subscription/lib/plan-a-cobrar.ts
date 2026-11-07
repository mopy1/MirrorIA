/** El plan viene por la URL: si no es uno de los ofrecidos, se cobra el actual. */
export function planACobrar<T extends { codigo: string }>(planes: T[], codigo: string | null, actual: T): T {
  return planes.find((p) => p.codigo === codigo) ?? actual
}

export function rutaDePago(planCodigo: string): string {
  return `/admin/suscripcion/activar?plan=${encodeURIComponent(planCodigo)}`
}
