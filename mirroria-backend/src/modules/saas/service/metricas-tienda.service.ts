import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';
import type { MetricasTiendaDto } from '../dto/metricas-tienda.dto.js';

/** Las fechas se guardan en UTC (proceso con TZ=UTC); los meses y días se cuentan en La Paz. */
const LP = `(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'America/La_Paz')`;
const MES_LP = `date_trunc('month', now() AT TIME ZONE 'America/La_Paz')`;
const VENDIDA = `estado IN ('PAGADA','ENTREGADA')`;

interface FilaVentas { n_mes: number; m_mes: string; n_ant: number; m_ant: string }
interface FilaConteos { productos: number; staff: number; clientas: number; sucursales: number; reservas: number; ultima: Date | null }
interface FilaDia { fecha: string; cantidad: number; monto: string }

/**
 * Métricas de UNA tienda para el panel de la plataforma. SQL crudo con `tenant_id = $1`
 * en cada consulta (precedente UsoPlanService: saas no importa entidades de otros módulos).
 * Solo count/sum: nunca devuelve filas, nombres ni ids de ventas, clientas o productos.
 */
@Injectable()
export class MetricasTiendaService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async calcular(tenantId: string): Promise<MetricasTiendaDto> {
    const [[v], [c], dias] = await Promise.all([
      this.dataSource.query(
        `SELECT count(*) FILTER (WHERE ${LP} >= ${MES_LP})::int AS n_mes,
                coalesce(sum(total_cents) FILTER (WHERE ${LP} >= ${MES_LP}), 0)::bigint AS m_mes,
                count(*) FILTER (WHERE ${LP} < ${MES_LP})::int AS n_ant,
                coalesce(sum(total_cents) FILTER (WHERE ${LP} < ${MES_LP}), 0)::bigint AS m_ant
           FROM ventas
          WHERE tenant_id = $1 AND ${VENDIDA} AND ${LP} >= ${MES_LP} - interval '1 month'`,
        [tenantId],
      ) as Promise<FilaVentas[]>,
      this.dataSource.query(
        `SELECT (SELECT count(*) FROM productos WHERE tenant_id = $1 AND activo)::int AS productos,
                (SELECT count(*) FROM usuarios WHERE tenant_id = $1 AND is_active
                    AND role IN ('ADMIN','ENCARGADO_SUCURSAL','CAJERO'))::int AS staff,
                (SELECT count(*) FROM usuarios WHERE tenant_id = $1 AND role = 'CUSTOMER')::int AS clientas,
                (SELECT count(*) FROM sucursales WHERE tenant_id = $1 AND activo)::int AS sucursales,
                (SELECT count(*) FROM reservas WHERE tenant_id = $1 AND ${LP} >= ${MES_LP})::int AS reservas,
                (SELECT max("createdAt") FROM ventas WHERE tenant_id = $1 AND ${VENDIDA}) AS ultima`,
        [tenantId],
      ) as Promise<FilaConteos[]>,
      this.dataSource.query(
        `SELECT to_char(d.dia, 'YYYY-MM-DD') AS fecha, count(v.*)::int AS cantidad,
                coalesce(sum(v.total_cents), 0)::bigint AS monto
           FROM generate_series((now() AT TIME ZONE 'America/La_Paz')::date - 29,
                                (now() AT TIME ZONE 'America/La_Paz')::date, interval '1 day') AS d(dia)
           LEFT JOIN ventas v ON v.tenant_id = $1 AND v.${VENDIDA}
                AND ((v."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'America/La_Paz')::date = d.dia::date
          GROUP BY d.dia ORDER BY d.dia`,
        [tenantId],
      ) as Promise<FilaDia[]>,
    ]);
    const cantidad = v?.n_mes ?? 0;
    const montoCents = Number(v?.m_mes ?? 0);
    return {
      ventasMes: { cantidad, montoCents },
      ventasMesAnterior: { cantidad: v?.n_ant ?? 0, montoCents: Number(v?.m_ant ?? 0) },
      ticketPromedioCents: cantidad ? Math.round(montoCents / cantidad) : 0,
      productosActivos: c?.productos ?? 0,
      usuariosStaff: c?.staff ?? 0,
      clientas: c?.clientas ?? 0,
      sucursalesActivas: c?.sucursales ?? 0,
      reservasMes: c?.reservas ?? 0,
      ultimaVentaAt: c?.ultima ? new Date(c.ultima).toISOString() : null,
      ventasPorDia: dias.map((d) => ({ fecha: d.fecha, cantidad: d.cantidad, montoCents: Number(d.monto) })),
    };
  }
}
