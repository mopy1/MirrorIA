import { z } from 'zod';
import type { Producto } from '../../admin-catalogo/types/catalogo-admin.types';
import { normalizar } from '../../admin-catalogo/lib/texto';
import type {
  AjustarStockDto,
  InventarioSucursal,
  Sucursal,
  TipoMovimiento,
  VarianteConProducto,
} from '../types/inventario.types';

/** Mismo umbral que la web (StockBadge): 1 a 5 unidades es "Bajo". */
export const UMBRAL_BAJO = 5;

export type NivelStock = 'agotado' | 'bajo' | 'ok';

export function nivelStock(disponible: number): NivelStock {
  if (disponible <= 0) return 'agotado';
  if (disponible <= UMBRAL_BAJO) return 'bajo';
  return 'ok';
}

/** Lo que de verdad se puede vender: lo reservado por clientas no cuenta. */
export function libre(f: Pick<InventarioSucursal, 'cantidadDisponible' | 'cantidadReservada'>): number {
  return Math.max(0, f.cantidadDisponible - f.cantidadReservada);
}

export function aplanarVariantes(productos: Producto[]): VarianteConProducto[] {
  return productos.flatMap((p) =>
    (p.variantes ?? []).map((v) => ({
      varianteId: v.id,
      productoId: p.id,
      coleccionId: p.coleccionId,
      productoTitulo: p.titulo,
      tallaNombre: v.tallaNombre,
      colorNombre: v.colorNombre,
      sku: v.sku,
      imagenUrl: [...(p.imagenes ?? [])].sort((a, b) => a.orden - b.orden)[0]?.url,
    }))
  );
}

export function nombreVariante(v: VarianteConProducto | undefined, varianteId: string): string {
  return v ? `${v.productoTitulo} · ${v.tallaNombre} · ${v.colorNombre}` : `Variante ${varianteId.slice(0, 8)}`;
}

export interface FilaStock extends InventarioSucursal {
  variante?: VarianteConProducto;
  nivel: NivelStock;
}

export type FiltroNivel = 'todas' | 'alertas';

/** Une el stock de la sucursal con su prenda, filtra por búsqueda / alertas y ordena (lo más urgente arriba). */
export function filasStock(
  filas: InventarioSucursal[],
  variantes: VarianteConProducto[],
  busqueda = '',
  filtro: FiltroNivel = 'todas'
): FilaStock[] {
  const porId = new Map(variantes.map((v) => [v.varianteId, v]));
  const q = normalizar(busqueda);
  const orden: Record<NivelStock, number> = { agotado: 0, bajo: 1, ok: 2 };
  return filas
    .map((f) => ({ ...f, variante: porId.get(f.varianteId), nivel: nivelStock(f.cantidadDisponible) }))
    .filter((f) => filtro === 'todas' || f.nivel !== 'ok')
    .filter((f) => !q || normalizar(`${nombreVariante(f.variante, f.varianteId)} ${f.variante?.sku ?? ''}`).includes(q))
    .sort((a, b) => orden[a.nivel] - orden[b.nivel] || (a.variante?.productoTitulo ?? '').localeCompare(b.variante?.productoTitulo ?? ''));
}

export interface ResumenStock {
  variantes: number;
  unidades: number;
  reservadas: number;
  enTransito: number;
  agotadas: number;
  bajas: number;
}

export function resumenStock(filas: InventarioSucursal[]): ResumenStock {
  return filas.reduce<ResumenStock>(
    (r, f) => {
      const n = nivelStock(f.cantidadDisponible);
      return {
        variantes: r.variantes + 1,
        unidades: r.unidades + f.cantidadDisponible,
        reservadas: r.reservadas + f.cantidadReservada,
        enTransito: r.enTransito + f.cantidadEnTransito,
        agotadas: r.agotadas + (n === 'agotado' ? 1 : 0),
        bajas: r.bajas + (n === 'bajo' ? 1 : 0),
      };
    },
    { variantes: 0, unidades: 0, reservadas: 0, enTransito: 0, agotadas: 0, bajas: 0 }
  );
}

/** La encargada solo ve su sucursal; la dueña, todas las activas. */
export function sucursalesPermitidas(sucursales: Sucursal[], role: string | undefined, sucursalPropia?: string | null): Sucursal[] {
  if (role === 'ENCARGADO_SUCURSAL') return sucursales.filter((s) => s.id === sucursalPropia);
  return sucursales.filter((s) => s.activo);
}

export const ajusteSchema = z.object({
  varianteId: z.string().min(1, 'Elegí la prenda y su variante'),
  sucursalId: z.string().min(1, 'Elegí la sucursal'),
  cantidad: z
    .string()
    .trim()
    .regex(/^[+-]?\d+$/, 'Poné un número entero: 10 para sumar, -2 para restar')
    .refine((v) => Number(v) !== 0, 'La cantidad no puede ser 0'),
  motivo: z.string().trim().min(3, 'Contá el motivo (ej. conteo físico, merma, prenda dañada)'),
});

export type AjusteFormValues = z.infer<typeof ajusteSchema>;

export function armarPayloadAjuste(v: AjusteFormValues): AjustarStockDto {
  return { varianteId: v.varianteId, sucursalId: v.sucursalId, cantidad: Number(v.cantidad.trim()), motivo: v.motivo.trim() };
}

/** ¿El ajuste dejaría el stock en negativo? (se avisa antes de mandarlo). */
export function quedariaNegativo(disponibleActual: number | undefined, cantidad: string): boolean {
  const n = Number(cantidad);
  return disponibleActual !== undefined && Number.isFinite(n) && disponibleActual + n < 0;
}

export const ETIQUETA_MOVIMIENTO: Record<TipoMovimiento, string> = {
  RESERVA: 'Reserva de clienta',
  LIBERACION_RESERVA: 'Reserva liberada',
  VENTA: 'Venta',
  DEVOLUCION: 'Devolución',
  RECEPCION_PROVEEDOR: 'Llegó del proveedor',
  AJUSTE: 'Ajuste manual',
};

export function etiquetaMovimiento(tipo: string): string {
  return ETIQUETA_MOVIMIENTO[tipo as TipoMovimiento] ?? tipo;
}
