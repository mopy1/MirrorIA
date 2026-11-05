import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';
import type { UsoPlanDto } from '../dto/suscripcion.dto.js';

const ROLES_STAFF_SQL = "('ADMIN','ENCARGADO_SUCURSAL','CAJERO')";

/**
 * Uso de cada tienda contra los topes de su plan. SQL crudo con `GROUP BY tenant_id`
 * (mismo precedente que `ia`): saas no importa entidades de otros módulos.
 * Solo conteos, nunca filas.
 */
@Injectable()
export class UsoPlanService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async calcular(tenantId: string): Promise<UsoPlanDto> {
    return (await this.calcularTodos([tenantId])).get(tenantId) ?? vacio();
  }

  /** Sin ids: todas las tiendas. */
  async calcularTodos(tenantIds?: string[]): Promise<Map<string, UsoPlanDto>> {
    const filtro = tenantIds ? 'AND tenant_id = ANY($1::uuid[])' : '';
    const params = tenantIds ? [tenantIds] : [];
    const contar = (tabla: string, condicion: string) =>
      this.dataSource.query(
        `SELECT tenant_id, count(*)::int AS n FROM ${tabla} WHERE ${condicion} ${filtro} GROUP BY tenant_id`,
        params,
      ) as Promise<Array<{ tenant_id: string; n: number }>>;

    const [sucursales, productos, staff] = await Promise.all([
      contar('sucursales', 'activo'),
      contar('productos', 'activo'),
      contar('usuarios', `is_active AND role IN ${ROLES_STAFF_SQL}`),
    ]);
    const uso = new Map<string, UsoPlanDto>();
    const de = (id: string) => {
      if (!uso.has(id)) uso.set(id, vacio());
      return uso.get(id)!;
    };
    for (const f of sucursales) de(f.tenant_id).sucursales = f.n;
    for (const f of productos) de(f.tenant_id).productos = f.n;
    for (const f of staff) de(f.tenant_id).usuariosStaff = f.n;
    return uso;
  }

  /** Ventas PAGADA/ENTREGADA de los últimos 30 días (detalle de la plataforma). */
  async ventasPagadas30d(tenantId: string): Promise<number> {
    const desde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const filas: Array<{ n: number }> = await this.dataSource.query(
      `SELECT count(*)::int AS n FROM ventas
        WHERE tenant_id = $1 AND estado IN ('PAGADA','ENTREGADA') AND "createdAt" >= $2`,
      [tenantId, desde],
    );
    return filas[0]?.n ?? 0;
  }
}

function vacio(): UsoPlanDto {
  return { sucursales: 0, productos: 0, usuariosStaff: 0 };
}
