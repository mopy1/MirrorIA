import type { NivelMarca } from '../marca/marca-reglas.js';

export class LimitesPlanDto {
  /** null = ilimitado */
  maxSucursales!: number | null;
  maxProductos!: number | null;
  maxUsuariosStaff!: number | null;
}

export class PlanDto {
  id!: string;
  codigo!: string;
  nombre!: string;
  descripcion!: string | null;
  /** BOB */
  precioMensualCents!: number;
  /** USD */
  precioMensualUsdCents!: number;
  diasPrueba!: number;
  orden!: number;
  activo!: boolean;
  limites!: LimitesPlanDto;
  nivelMarca!: NivelMarca;
  destacado!: boolean;
}
