import { z } from 'zod';
import { formatMoney } from '../../../lib/money';
import type { CreateCuponDto, Cupon, TipoDescuentoCupon } from '../types/cupones.types';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

function numero(texto: string): number {
  return Number(texto.trim().replace(',', '.'));
}

/** Formulario de alta (todo texto, como lo escribe la dueña). Mismas reglas y mensajes que CrearCuponDialog de la web. */
export const cuponSchema = z
  .object({
    codigo: z.string().trim().min(1, 'El código del cupón es obligatorio').max(50, 'Máximo 50 caracteres'),
    tipoDescuento: z.enum(['PORCENTAJE', 'MONTO_FIJO']),
    valor: z.string().trim().min(1, 'Ingresá el valor del descuento'),
    fechaInicio: z.string().trim().regex(FECHA, 'Usá el formato AAAA-MM-DD'),
    fechaFin: z.string().trim().regex(FECHA, 'Usá el formato AAAA-MM-DD'),
    usosMaximos: z.string().trim(),
    montoMinimo: z.string().trim(),
  })
  .superRefine((v, ctx) => {
    const valor = numero(v.valor);
    if (v.valor && (Number.isNaN(valor) || valor <= 0)) {
      ctx.addIssue({ code: 'custom', path: ['valor'], message: 'El valor de descuento debe ser un número mayor a 0' });
    } else if (v.tipoDescuento === 'PORCENTAJE' && valor > 100) {
      ctx.addIssue({ code: 'custom', path: ['valor'], message: 'El porcentaje de descuento no puede ser superior al 100%' });
    } else if (v.tipoDescuento === 'PORCENTAJE' && !Number.isInteger(valor)) {
      ctx.addIssue({ code: 'custom', path: ['valor'], message: 'El porcentaje debe ser un número entero' });
    }
    if (FECHA.test(v.fechaInicio) && FECHA.test(v.fechaFin) && v.fechaFin < v.fechaInicio) {
      ctx.addIssue({ code: 'custom', path: ['fechaFin'], message: 'La fecha de fin no puede ser anterior a la de inicio' });
    }
    if (v.usosMaximos) {
      const usos = numero(v.usosMaximos);
      if (!Number.isInteger(usos) || usos < 1) {
        ctx.addIssue({ code: 'custom', path: ['usosMaximos'], message: 'El límite de canjes debe ser un entero mayor a 0' });
      }
    }
    if (v.montoMinimo) {
      const monto = numero(v.montoMinimo);
      if (Number.isNaN(monto) || monto < 0) {
        ctx.addIssue({ code: 'custom', path: ['montoMinimo'], message: 'El monto mínimo no puede ser negativo' });
      }
    }
  });

export type CuponFormValues = z.infer<typeof cuponSchema>;

function isoDia(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Valores por defecto: vigencia de hoy a dentro de un mes (como la web). */
export function valoresIniciales(hoy: Date = new Date()): CuponFormValues {
  const fin = new Date(hoy);
  fin.setMonth(fin.getMonth() + 1);
  return {
    codigo: '',
    tipoDescuento: 'PORCENTAJE',
    valor: '',
    fechaInicio: isoDia(hoy),
    fechaFin: isoDia(fin),
    usosMaximos: '',
    montoMinimo: '',
  };
}

/** Del formulario al DTO del backend: montos en centavos, vigencia de día completo en UTC (igual que la web). */
export function armarCuponDto(v: CuponFormValues): CreateCuponDto {
  const valor = numero(v.valor);
  return {
    codigo: v.codigo.trim().toUpperCase(),
    tipoDescuento: v.tipoDescuento,
    valor: v.tipoDescuento === 'MONTO_FIJO' ? Math.round(valor * 100) : Math.round(valor),
    fechaInicio: `${v.fechaInicio.trim()}T00:00:00.000Z`,
    fechaFin: `${v.fechaFin.trim()}T23:59:59.000Z`,
    usosMaximos: v.usosMaximos ? parseInt(v.usosMaximos, 10) : null,
    montoMinimoCents: v.montoMinimo ? Math.round(numero(v.montoMinimo) * 100) : null,
    activo: true,
  };
}

export type EstadoCupon = 'INACTIVO' | 'EXPIRADO' | 'AGOTADO' | 'ACTIVO';

/** Mismo orden de prioridad que la tabla de la web: inactivo > expirado > agotado > activo. */
export function estadoCupon(c: Cupon, ahora: Date = new Date()): EstadoCupon {
  if (!c.activo) return 'INACTIVO';
  if (ahora > new Date(c.fechaFin)) return 'EXPIRADO';
  if (c.usosMaximos !== null && c.usosActuales >= c.usosMaximos) return 'AGOTADO';
  return 'ACTIVO';
}

export const ETIQUETA_ESTADO: Record<EstadoCupon, string> = {
  INACTIVO: 'Inactivo',
  EXPIRADO: 'Expirado',
  AGOTADO: 'Agotado',
  ACTIVO: 'Activo',
};

export const ETIQUETA_TIPO: Record<TipoDescuentoCupon, string> = {
  PORCENTAJE: 'Porcentaje (%)',
  MONTO_FIJO: 'Monto fijo (Bs.)',
};

export function textoDescuento(c: Pick<Cupon, 'tipoDescuento' | 'valor'>): string {
  return c.tipoDescuento === 'PORCENTAJE' ? `${c.valor}% OFF` : `-${formatMoney(c.valor)}`;
}

export function textoUsos(c: Pick<Cupon, 'usosActuales' | 'usosMaximos'>): string {
  return `${c.usosActuales} / ${c.usosMaximos !== null ? c.usosMaximos : '∞'}`;
}

export function formatFecha(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}
