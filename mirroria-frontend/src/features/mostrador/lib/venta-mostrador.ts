import { ApiError } from "@/lib/api"

export interface ItemMostrador {
  varianteId: string
  productoId: string
  titulo: string
  talla: string
  color: string
  sku: string
  precioCents: number
  disponible: number
}

export interface LineaVenta {
  item: ItemMostrador
  cantidad: number
}

export interface VentaPayload {
  sucursalId: string
  items: { varianteId: string; cantidad: number; precioUnitCents?: number }[]
}

export function agregarLinea(lineas: LineaVenta[], item: ItemMostrador, disponible: number): LineaVenta[] {
  const actual = lineas.find((l) => l.item.varianteId === item.varianteId)
  if ((actual?.cantidad ?? 0) >= disponible) return lineas
  return actual
    ? lineas.map((l) => (l === actual ? { ...l, cantidad: l.cantidad + 1 } : l))
    : [...lineas, { item, cantidad: 1 }]
}

export function quitarLinea(lineas: LineaVenta[], varianteId: string): LineaVenta[] {
  return lineas.filter((l) => l.item.varianteId !== varianteId)
}

export function totalCents(lineas: LineaVenta[]): number {
  return lineas.reduce((a, l) => a + l.item.precioCents * l.cantidad, 0)
}

/** Lo que esta caja ya vendió sin conexión todavía figura en la foto del stock. */
export function disponibleLocal(item: ItemMostrador, pendientes: { payload: unknown }[]): number {
  const vendido = pendientes.reduce((total, op) => {
    const items = (op.payload as Partial<VentaPayload>).items ?? []
    return total + items.filter((i) => i.varianteId === item.varianteId).reduce((a, i) => a + i.cantidad, 0)
  }, 0)
  return Math.max(0, item.disponible - vendido)
}

export type ResultadoVenta<V> = { estado: "REGISTRADA"; venta: V } | { estado: "EN_COLA"; operacionId: string }

interface Dependencias<V> {
  enLinea: () => boolean
  enviar: (payload: VentaPayload, clave: string) => Promise<V>
  encolar: (payload: VentaPayload, clave: string) => Promise<{ id: string }>
  generarClave: () => string
}

/** Sin respuesta del servidor no se sabe si guardó: se reintenta con la misma clave, que no duplica. */
function debeIrALaCola(error: unknown): boolean {
  return !(error instanceof ApiError) || error.status >= 500
}

export async function registrarVenta<V>(payload: VentaPayload, deps: Dependencias<V>): Promise<ResultadoVenta<V>> {
  const clave = deps.generarClave()
  const aLaCola = async (): Promise<ResultadoVenta<V>> => ({
    estado: "EN_COLA",
    operacionId: (await deps.encolar(payload, clave)).id,
  })
  if (!deps.enLinea()) return aLaCola()
  try {
    return { estado: "REGISTRADA", venta: await deps.enviar(payload, clave) }
  } catch (error) {
    if (debeIrALaCola(error)) return aLaCola()
    throw error
  }
}
