import type { PlanDto, SuscripcionDto, TiendaPublica, UsoPlanDto } from '../../saas/types/saas.types';

/** `GET /saas/mi-suscripcion` (solo ADMIN). */
export interface MiSuscripcionDto {
  tienda: TiendaPublica;
  plan: PlanDto;
  suscripcion: SuscripcionDto;
  uso: UsoPlanDto;
  historial: SuscripcionDto[];
  /** true solo en la prueba gratis: el cambio de plan no se cobra. */
  puedeCambiarPlan: boolean;
  pagoDisponible: boolean;
}

export type PasarelaSuscripcion = 'WAYRA' | 'STRIPE' | 'PAYPAL' | 'QR_BANCARIO';

export interface IniciarCobroSuscripcionDto {
  pasarela: PasarelaSuscripcion;
  planCodigo?: string;
}

export interface CobroSuscripcionResponseDto {
  cobroId: string;
  pasarela: string;
  modo: 'REDIRECT' | 'QR' | 'INSTRUCCIONES';
  montoCents: number;
  url?: string;
  qrBase64?: string;
  token?: string;
  expiraEn?: string;
  instrucciones?: string;
}

export interface EstadoCobroSuscripcionResponseDto {
  cobroId: string;
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'EXPIRADO';
  pagado: boolean;
  pagadoEn?: string;
}

// Banco simulado Wayra (la "app del banco" que paga el QR).
export interface CuentaWayra {
  id: string;
  tipo: string;
  numeroEnmascarado: string;
  saldoCents: number;
}

export interface CobroWayra {
  comercio: string;
  glosa: string;
  referencia: string;
  montoCents: number;
  estado: 'PENDIENTE' | 'PAGADO' | 'VENCIDO';
  transaccion: string | null;
  pagadoEn: string | null;
  titular: string;
  cuentas: CuentaWayra[];
}

export interface ComprobanteWayra {
  transaccion: string;
  comercio: string;
  glosa: string;
  referencia: string;
  montoCents: number;
  cuentaOrigen: string;
  titular: string;
  pagadoEn: string;
}
