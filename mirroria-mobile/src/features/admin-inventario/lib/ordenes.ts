import type {
  CreateOrdenCompraDto,
  EstadoOrdenCompra,
  OrdenCompra,
  RecibirOrdenCompraDto,
  VarianteConProducto,
} from '../types/inventario.types';

export interface ResumenOrdenesProveedor {
  abiertas: number;
  unidadesEnTransito: number;
}

export const esAbierta = (o: Pick<OrdenCompra, 'estado'>) => o.estado === 'PENDIENTE' || o.estado === 'RECIBIDA_PARCIAL';

/** Por proveedor: órdenes que esperan mercadería y unidades que faltan llegar (igual que la web). */
export function resumenPorProveedor(ordenes: OrdenCompra[]): Map<string, ResumenOrdenesProveedor> {
  const mapa = new Map<string, ResumenOrdenesProveedor>();
  for (const o of ordenes) {
    if (!esAbierta(o)) continue;
    const actual = mapa.get(o.proveedorId) ?? { abiertas: 0, unidadesEnTransito: 0 };
    actual.abiertas += 1;
    actual.unidadesEnTransito += pendientes(o);
    mapa.set(o.proveedorId, actual);
  }
  return mapa;
}

export function pendientes(o: OrdenCompra): number {
  return o.items.reduce((a, i) => a + Math.max(0, i.cantidadPedida - i.cantidadRecibida), 0);
}

export const ETIQUETA_ESTADO: Record<EstadoOrdenCompra, string> = {
  PENDIENTE: 'Pendiente',
  RECIBIDA_PARCIAL: 'Parcial',
  RECIBIDA: 'Recibida',
  CANCELADA: 'Cancelada',
  EN_TRANSITO: 'En camino',
};

/** Variantes que vende un proveedor: variante → colección de su prenda → proveedor de la colección. */
export function variantesDelProveedor(
  variantes: VarianteConProducto[],
  colecciones: { id: string; proveedorId: string }[],
  proveedorId: string
): VarianteConProducto[] {
  const prov = new Map(colecciones.map((c) => [c.id, c.proveedorId]));
  return proveedorId ? variantes.filter((v) => prov.get(v.coleccionId) === proveedorId) : [];
}

export function proveedorDeVariante(
  variantes: VarianteConProducto[],
  colecciones: { id: string; proveedorId: string }[],
  varianteId: string
): string {
  const v = variantes.find((x) => x.varianteId === varianteId);
  return (v && colecciones.find((c) => c.id === v.coleccionId)?.proveedorId) || '';
}

/** "AAAA-MM-DD" válido y no en el pasado (el backend rechaza fechas pasadas). */
export function fechaEsperadaValida(texto: string, hoy = new Date()): boolean {
  if (!texto) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const d = new Date(`${texto}T23:59:59`);
  return !Number.isNaN(d.getTime()) && d.getTime() >= hoy.getTime() - 60_000;
}

/** Cuerpo del POST: solo las prendas con cantidad > 0. Devuelve el error a mostrar si falta algo. */
export function armarPayloadOrden(
  proveedorId: string,
  sucursalDestinoId: string,
  cantidades: Record<string, string>,
  fechaEsperada: string
): { dto?: CreateOrdenCompraDto; error?: string } {
  const items = Object.entries(cantidades)
    .map(([varianteId, c]) => ({ varianteId, cantidadPedida: Number(c) }))
    .filter((i) => Number.isInteger(i.cantidadPedida) && i.cantidadPedida > 0);
  if (!proveedorId || !sucursalDestinoId || items.length === 0) {
    return { error: 'Completá proveedor, sucursal y al menos una prenda con cantidad' };
  }
  if (!fechaEsperadaValida(fechaEsperada)) return { error: 'La fecha esperada tiene que ser AAAA-MM-DD y no puede estar en el pasado' };
  return { dto: { proveedorId, sucursalDestinoId, items, ...(fechaEsperada ? { fechaEsperada } : {}) } };
}

/** Recepción: lo que falta llegar de cada prenda como valor inicial. */
export function cantidadesIniciales(o: OrdenCompra): Record<string, string> {
  return Object.fromEntries(o.items.map((i) => [i.varianteId, String(Math.max(0, i.cantidadPedida - i.cantidadRecibida))]));
}

export function armarPayloadRecepcion(o: OrdenCompra, cantidades: Record<string, string>): { dto?: RecibirOrdenCompraDto; error?: string } {
  const items = o.items
    .map((i) => ({ varianteId: i.varianteId, cantidadRecibida: Number(cantidades[i.varianteId] ?? 0), max: i.cantidadPedida - i.cantidadRecibida }))
    .filter((i) => Number.isFinite(i.cantidadRecibida) && i.cantidadRecibida > 0);
  if (items.length === 0) return { error: 'Ingresá al menos una unidad para recibir' };
  if (items.some((i) => !Number.isInteger(i.cantidadRecibida) || i.cantidadRecibida > i.max)) {
    return { error: 'No podés recibir más de lo que falta llegar de cada prenda' };
  }
  return { dto: { items: items.map(({ varianteId, cantidadRecibida }) => ({ varianteId, cantidadRecibida })) } };
}
