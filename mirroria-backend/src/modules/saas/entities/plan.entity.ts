import { Check, Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../core/database/base.entity.js';
import type { NivelMarca } from '../marca/marca-reglas.js';

const centavos = { to: (v: number) => v, from: (v: string) => Number(v) };

/** Catálogo de planes del SaaS (global, sin tenant). `codigo` es inmutable. */
@Entity('planes')
@Check('CHK_planes_nivel_marca', `"nivel_marca" IN ('ESENCIAL','COMPLETA','MARCA_BLANCA')`)
export class Plan extends BaseEntity {
  @Column({ length: 30, unique: true })
  codigo!: string;

  @Column({ length: 60 })
  nombre!: string;

  @Column({ type: 'text', nullable: true })
  descripcion!: string | null;

  /** BOB (QR nacional). */
  @Column({ name: 'precio_mensual_cents', type: 'bigint', transformer: centavos })
  precioMensualCents!: number;

  /** USD, para PayPal en la Fase 2 (PayPal no cobra en BOB). */
  @Column({ name: 'precio_mensual_usd_cents', type: 'bigint', transformer: centavos })
  precioMensualUsdCents!: number;

  /** NULL = ilimitado (igual en los tres topes). */
  @Column({ name: 'max_sucursales', type: 'integer', nullable: true })
  maxSucursales!: number | null;

  /** Productos ACTIVOS. */
  @Column({ name: 'max_productos', type: 'integer', nullable: true })
  maxProductos!: number | null;

  /** Usuarios activos con rol ADMIN / ENCARGADO_SUCURSAL / CAJERO. */
  @Column({ name: 'max_usuarios_staff', type: 'integer', nullable: true })
  maxUsuariosStaff!: number | null;

  @Column({ name: 'dias_prueba', type: 'integer', default: 14 })
  diasPrueba!: number;

  @Column({ type: 'integer', default: 0 })
  orden!: number;

  /** Un plan inactivo no se ofrece, pero sus suscripciones siguen valiendo. */
  @Column({ default: true })
  activo!: boolean;

  /** Qué personalización incluye (Fase 1b §C.4). */
  @Column({ name: 'nivel_marca', type: 'varchar', length: 20, default: 'ESENCIAL' })
  nivelMarca!: NivelMarca;

  /** "Más elegido" en la landing. A lo sumo uno (PlanesService apaga los demás). */
  @Column({ type: 'boolean', default: false })
  destacado!: boolean;
}
