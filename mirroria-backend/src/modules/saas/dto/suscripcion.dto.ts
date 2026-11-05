import type { EstadoSuscripcion } from '../entities/suscripcion.entity.js';

export class UsoPlanDto {
  sucursales!: number;
  productos!: number;
  usuariosStaff!: number;
}

export class SuscripcionDto {
  id!: string;
  estado!: EstadoSuscripcion;
  plan!: { id: string; codigo: string; nombre: string };
  inicio!: string;
  fin!: string;
  /** ceil((fin - now)/día), mínimo 0 */
  diasRestantes!: number;
  precioCents!: number;
  proveedorPago!: string | null;
  referenciaPago!: string | null;
}
