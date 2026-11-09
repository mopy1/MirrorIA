import type { PasarelaId, PasarelaMetadata } from '../types/pasarelas.types';

export type MetodoCheckout = 'TARJETA' | 'PAYPAL' | 'QR' | 'EFECTIVO';

export interface OpcionPago {
  metodo: MetodoCheckout;
  titulo: string;
  detalle: string;
  /** false: la pasarela existe pero el servidor no la tiene lista (se muestra apagada). */
  disponible: boolean;
}

const POR_DEFECTO: OpcionPago[] = [
  { metodo: 'TARJETA', titulo: 'Tarjeta (Stripe)', detalle: 'Crédito o débito, en la página segura de Stripe.', disponible: true },
  { metodo: 'PAYPAL', titulo: 'PayPal', detalle: 'Con tu cuenta PayPal, en su página.', disponible: true },
  { metodo: 'QR', titulo: 'QR Simple', detalle: 'Escaneá el código con la app de tu banco.', disponible: true },
  { metodo: 'EFECTIVO', titulo: 'Efectivo', detalle: 'Pagás al retirar en la sucursal.', disponible: true },
];

const METODO_DE: Record<PasarelaId, MetodoCheckout | null> = {
  STRIPE: 'TARJETA',
  PAYPAL: 'PAYPAL',
  WAYRA: 'QR',
  QR_BANCARIO: null, // el QR de compras es el de Wayra; el bancario directo no tiene camino propio
  MANUAL: 'EFECTIVO',
};

/**
 * Los medios de pago de una compra, en orden fijo. Si el servidor no
 * respondió la lista de pasarelas (sin red, error), se ofrecen todos: la API
 * igual contesta con un error claro si alguno no está configurado.
 */
export function opcionesDePago(pasarelas: PasarelaMetadata[] | null): OpcionPago[] {
  if (!pasarelas || pasarelas.length === 0) return POR_DEFECTO;
  return POR_DEFECTO.map((op) => {
    const p = pasarelas.find((x) => METODO_DE[x.id] === op.metodo && x.soportaCheckout);
    if (!p) return { ...op, disponible: false };
    return { ...op, disponible: p.estado === 'DISPONIBLE' };
  });
}

/** Pasarelas que sirven para pagar la suscripción, en el orden de la web. */
export function pasarelasDeSuscripcion(pasarelas: PasarelaMetadata[]): PasarelaMetadata[] {
  const orden: PasarelaId[] = ['WAYRA', 'STRIPE', 'PAYPAL', 'QR_BANCARIO'];
  return pasarelas
    .filter((p) => p.soportaSuscripcion && orden.includes(p.id))
    .sort((a, b) => orden.indexOf(a.id) - orden.indexOf(b.id));
}

export type ResultadoVenta = 'pagada' | 'pendiente' | 'inactiva';

/** Al volver de la pasarela se mira el estado REAL de la venta, no la URL de regreso. */
export function resultadoDeVenta(estado: string): ResultadoVenta {
  if (estado === 'PAGADA' || estado === 'ENTREGADA') return 'pagada';
  if (estado === 'PENDIENTE') return 'pendiente';
  return 'inactiva';
}
