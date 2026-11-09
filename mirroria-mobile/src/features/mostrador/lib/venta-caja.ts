import type { NuevaVenta, PayloadVentaCaja, RespuestaCaja, VentaCaja } from '../../../lib/offline/colaCaja';
import { mensajeDe, veredicto } from '../../../lib/offline/colaCaja';
import type { ItemCaja } from '../../../lib/offline/stockCajaLocal';

export type ItemMostrador = ItemCaja;

export interface LineaVenta {
  item: ItemMostrador;
  cantidad: number;
}

/** A quién se le vende: opcional. Viene de una reserva (la clienta se probó y compra). */
export interface ClientaVenta {
  clienteId: string;
  reservaId: string;
  codigo: string;
}

export function agregarLinea(lineas: LineaVenta[], item: ItemMostrador, disponible: number): LineaVenta[] {
  const actual = lineas.find((l) => l.item.varianteId === item.varianteId);
  if ((actual?.cantidad ?? 0) >= disponible) return lineas;
  return actual
    ? lineas.map((l) => (l === actual ? { ...l, cantidad: l.cantidad + 1 } : l))
    : [...lineas, { item, cantidad: 1 }];
}

export function restarLinea(lineas: LineaVenta[], varianteId: string): LineaVenta[] {
  return lineas
    .map((l) => (l.item.varianteId === varianteId ? { ...l, cantidad: l.cantidad - 1 } : l))
    .filter((l) => l.cantidad > 0);
}

export function quitarLinea(lineas: LineaVenta[], varianteId: string): LineaVenta[] {
  return lineas.filter((l) => l.item.varianteId !== varianteId);
}

export function totalCents(lineas: LineaVenta[]): number {
  return lineas.reduce((a, l) => a + l.item.precioCents * l.cantidad, 0);
}

export function unidades(lineas: LineaVenta[]): number {
  return lineas.reduce((a, l) => a + l.cantidad, 0);
}

/**
 * Lo que se puede vender todavía: la foto del stock menos lo que esta caja vendió y la foto
 * no refleja. `apartado` suma lo que la reserva que se está cobrando tiene separado para ella.
 */
export function disponibleLocal(
  item: ItemMostrador,
  vendido: Record<string, number>,
  apartado: Record<string, number> = {},
): number {
  return Math.max(0, item.disponible - (vendido[item.varianteId] ?? 0) + (apartado[item.varianteId] ?? 0));
}

export function filtrarCatalogo(items: ItemMostrador[], busqueda: string, max = 60): ItemMostrador[] {
  const q = busqueda.trim().toLowerCase();
  const palabras = q.split(/\s+/).filter(Boolean);
  return items
    .filter((i) => {
      const texto = `${i.titulo} ${i.talla} ${i.color} ${i.sku}`.toLowerCase();
      return palabras.every((p) => texto.includes(p));
    })
    .slice(0, max);
}

/** El cuerpo de la venta. Se arma UNA vez y viaja idéntico en línea y desde la cola. */
export function armarPayload(
  sucursalId: string,
  lineas: LineaVenta[],
  clienta: ClientaVenta | null,
  ahora: Date,
): PayloadVentaCaja {
  return {
    sucursalId,
    vendidaEn: ahora.toISOString(),
    ...(clienta ? { clienteId: clienta.clienteId, reservaId: clienta.reservaId } : {}),
    items: lineas.map((l) => ({ varianteId: l.item.varianteId, cantidad: l.cantidad, precioUnitCents: l.item.precioCents })),
  };
}

export function resumenVenta(lineas: LineaVenta[]): string {
  return lineas.map((l) => `${l.cantidad} × ${l.item.titulo} (${l.item.talla}, ${l.item.color})`).join('; ');
}

export class VentaRechazada extends Error {
  constructor(message: string, readonly status: number, readonly codigo?: string) {
    super(message);
  }
}

export interface VentaRegistrada {
  id: string;
  numeroComprobante: string | null;
  totalCents: number;
}

export type ResultadoCobro =
  | { estado: 'REGISTRADA'; venta: VentaRegistrada }
  | { estado: 'EN_COLA'; ventaId: string; motivo: 'SIN_RED' | 'SIN_RESPUESTA' | 'TIENDA_NO_DISPONIBLE' };

export interface DependenciasCobro {
  enLinea: () => boolean;
  /** POST /ventas/presenciales con el cuerpo ya serializado; lanza si no hay red. */
  enviar: (cuerpo: string, clave: string) => Promise<RespuestaCaja>;
  encolar: (v: NuevaVenta) => Promise<void>;
  anotarEnviada: (v: NuevaVenta, respuesta: unknown) => Promise<void>;
  generarId: () => string;
}

/**
 * Cobra: con red manda la venta; sin red, o sin respuesta definitiva, la guarda en la cola con
 * LA MISMA clave y EL MISMO cuerpo (si el servidor sí la guardó, el reintento devuelve la misma venta).
 * Un rechazo de negocio con la clienta enfrente se avisa en el momento y no se encola.
 */
export async function cobrar(
  venta: Omit<NuevaVenta, 'id' | 'clave'>,
  deps: DependenciasCobro,
): Promise<ResultadoCobro> {
  const nueva: NuevaVenta = { ...venta, id: deps.generarId(), clave: deps.generarId() };
  const aLaCola = async (motivo: 'SIN_RED' | 'SIN_RESPUESTA' | 'TIENDA_NO_DISPONIBLE'): Promise<ResultadoCobro> => {
    await deps.encolar(nueva);
    return { estado: 'EN_COLA', ventaId: nueva.id, motivo };
  };
  if (!deps.enLinea()) return aLaCola('SIN_RED');
  let r: RespuestaCaja;
  try {
    r = await deps.enviar(JSON.stringify(nueva.payload), nueva.clave);
  } catch {
    return aLaCola('SIN_RESPUESTA');
  }
  const v = veredicto(r.status, r.body?.codigo);
  if (v === 'ENVIADA') {
    await deps.anotarEnviada(nueva, r.body);
    return { estado: 'REGISTRADA', venta: r.body as unknown as VentaRegistrada };
  }
  if (v === 'REINTENTAR' && r.status !== 401) {
    return aLaCola(r.body?.codigo === 'TIENDA_NO_DISPONIBLE' ? 'TIENDA_NO_DISPONIBLE' : 'SIN_RESPUESTA');
  }
  if (r.status === 401) throw new VentaRechazada('Tu sesión venció. Volvé a entrar y cobrá de nuevo.', 401);
  throw new VentaRechazada(motivoRechazo(r), r.status, r.body?.codigo);
}

/** El motivo en palabras de caja, sin ids técnicos. */
export function motivoRechazo(r: Pick<RespuestaCaja, 'status' | 'body'>): string {
  if (r.body?.codigo === 'STOCK_AGOTADO_CONFLICTO') {
    return 'No quedaba stock de una de las prendas (otra caja o la tienda en línea la vendió antes).';
  }
  return mensajeDe(r as RespuestaCaja);
}

/** Aviso que queda en pantalla hasta que la cajera lo marca como atendido. */
export function avisoFallida(v: Pick<VentaCaja, 'resumen' | 'total_cents' | 'creado_en' | 'respuesta' | 'codigo' | 'error'>, formatear: (c: number) => string): string {
  let body: RespuestaCaja['body'] = {};
  try {
    body = v.respuesta ? JSON.parse(v.respuesta) : {};
  } catch {
    body = {};
  }
  const motivo = motivoRechazo({ status: v.codigo ?? 0, body: { ...body, message: body.message ?? v.error ?? undefined } });
  const fecha = new Date(v.creado_en).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
  return (
    `La venta del ${fecha} por ${formatear(v.total_cents)} (${v.resumen}) no se registró. ${motivo} ` +
    'Si la clienta ya pagó, devolvele el dinero o cambiale la prenda por otra con stock.'
  );
}
