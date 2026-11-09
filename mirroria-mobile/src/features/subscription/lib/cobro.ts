// Lógica pura del cobro de la suscripción (espejo de la web:
// subscription/lib/plan-a-cobrar.ts y regreso-cobro.ts).
import type { EstadoSuscripcion } from '../../saas/types/saas.types';

/** El plan elegido para pagar; si no es uno de los ofrecidos, se cobra el actual. */
export function planACobrar<T extends { codigo: string }>(planes: T[], codigo: string | null, actual: T): T {
  return planes.find((p) => p.codigo === codigo) ?? actual;
}

export type EstadoRegreso = 'esperando' | 'confirmando' | 'pagado' | 'pendiente' | 'rechazado' | 'error';

export interface AvisoRegreso {
  tono: 'exito' | 'info' | 'error';
  texto: string;
  reintentable: boolean;
}

/**
 * Volver de la pasarela no prueba nada: solo el backend, preguntándole a
 * Stripe o PayPal, sabe si se pagó. Una respuesta tardía de "pendiente" no
 * pisa un pago ya confirmado.
 */
export function siguienteEstado(actual: EstadoRegreso | null, respuesta: { pagado: boolean; estado: string }): EstadoRegreso {
  if (respuesta.pagado || actual === 'pagado') return 'pagado';
  return respuesta.estado === 'RECHAZADO' ? 'rechazado' : 'pendiente';
}

const AVISOS: Record<EstadoRegreso, AvisoRegreso> = {
  esperando: {
    tono: 'info',
    texto: 'Abrimos la pasarela de pago. Cuando termines, volvé a la app y tocá "Ya pagué, revisar".',
    reintentable: true,
  },
  confirmando: { tono: 'info', texto: 'Estamos confirmando tu pago con la pasarela…', reintentable: false },
  pagado: {
    tono: 'exito',
    texto: '¡Tu pago fue acreditado con éxito! Tu suscripción fue renovada y tu tienda continúa activa.',
    reintentable: false,
  },
  pendiente: {
    tono: 'info',
    texto: 'Todavía no vemos tu pago confirmado. Si ya pagaste, puede tardar unos minutos.',
    reintentable: true,
  },
  rechazado: { tono: 'error', texto: 'La pasarela rechazó el pago. No se te cobró: probá con otro medio.', reintentable: false },
  error: { tono: 'error', texto: 'No pudimos consultar tu pago. Probá de nuevo en unos segundos.', reintentable: true },
};

export function avisoDeRegreso(estado: EstadoRegreso): AvisoRegreso {
  return AVISOS[estado];
}

export const ETIQUETA_ESTADO: Record<EstadoSuscripcion, string> = {
  TRIAL: 'Prueba gratis',
  ACTIVA: 'Activa',
  VENCIDA: 'Vencida',
  CANCELADA: 'Cancelada',
};

export function textoDiasRestantes(dias: number): string {
  if (dias <= 0) return 'Vencida';
  return `${dias} ${dias === 1 ? 'día' : 'días'}`;
}

/** "2026-11-22T..." → "22/11/2026" (sin depender del locale del teléfono). */
export function formatFecha(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** Fuera de la prueba, cambiar de plan se paga: el diálogo manda a cobrar en vez de cambiar. */
export function cambioSePaga(puedeCambiarPlan: boolean): boolean {
  return !puedeCambiarPlan;
}
