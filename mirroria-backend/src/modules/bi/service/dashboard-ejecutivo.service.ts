import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';
import { tenantActual } from '../../../core/tenancy/tenant-context.js';
import { FiltroDashboardEjecutivoDto, PeriodoDashboard } from '../dto/filtro-dashboard-ejecutivo.dto.js';
import type {
  DashboardEjecutivoResponseDto,
  DistribucionPagoDto,
  KpisEjecutivosDto,
  LimiteRecursoPlanDto,
  PeriodoResumenDto,
  PlanSaaSEjecutivoDto,
  TendenciaIngresoDiaDto,
  TopPrendaDto,
  TopProveedorDto,
} from '../dto/dashboard-ejecutivo.dto.js';
import { PeriodosService } from './periodos.service.js';
import { UsoPlanService } from '../../saas/service/uso-plan.service.js';

interface FilaTotalesVenta {
  ingresos_cents: string | number;
  cantidad_ventas: string | number;
  ticket_promedio_cents: string | number;
}

interface FilaUnidadesVendidas {
  unidades_vendidas: string | number;
}

interface FilaStockDisponible {
  stock_disponible: string | number;
}

interface FilaConteo {
  total: string | number;
}

interface FilaTendencia {
  fecha: string;
  ingresos_cents: string | number;
  ventas: string | number;
}

interface FilaPago {
  proveedor: string;
  metodo: string;
  transacciones: string | number;
  monto_cents: string | number;
}

interface FilaTopPrenda {
  producto_id: string;
  nombre: string;
  categoria: string;
  imagen_url: string | null;
  unidades_vendidas: string | number;
  ingresos_cents: string | number;
}

interface FilaTopProveedor {
  proveedor_id: string;
  nombre: string;
  ingresos_cents: string | number;
  unidades_vendidas: string | number;
}

interface FilaSuscripcionPlan {
  id: string;
  estado: string;
  fin: Date | string | null;
  plan_nombre: string;
  nivel_marca: string;
  max_sucursales: number | null;
  max_productos: number | null;
  max_usuarios_staff: number | null;
}

@Injectable()
export class DashboardEjecutivoService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly periodosService: PeriodosService,
    private readonly usoPlanService: UsoPlanService,
  ) {}

  async obtener(filtro: FiltroDashboardEjecutivoDto = {}): Promise<DashboardEjecutivoResponseDto> {
    const tenantId = tenantActual();
    const periodoTipo = filtro.periodo ?? PeriodoDashboard.TREINTA_DIAS;
    const rango = this.periodosService.calcularRango(
      periodoTipo,
      filtro.fechaInicio,
      filtro.fechaFin,
    );

    const sucursalId = filtro.sucursalId ?? null;

    // 0. Resolver nombre de sucursal
    let sucursalNombre = 'Todas las sucursales';
    if (sucursalId) {
      const sucursalRows = (await this.dataSource.query(
        'SELECT nombre FROM sucursales WHERE id = $1 AND tenant_id = $2 LIMIT 1',
        [sucursalId, tenantId],
      )) as Array<{ nombre: string }>;
      if (sucursalRows.length > 0) {
        sucursalNombre = sucursalRows[0].nombre;
      }
    }

    const periodoDto: PeriodoResumenDto = {
      clave: rango.clave,
      desde: rango.desde.toISOString(),
      hasta: rango.hasta.toISOString(),
      sucursalId,
      sucursalNombre,
    };

    // Parámetros y fragmentos condicionales de sucursal
    const paramsActual: unknown[] = [tenantId, rango.desde, rango.hasta];
    const paramsAnterior: unknown[] = [tenantId, rango.anteriorDesde, rango.anteriorHasta];
    let filtroSucVenta = '';
    let filtroSucInv = '';
    let filtroSucRes = '';

    if (sucursalId) {
      paramsActual.push(sucursalId);
      paramsAnterior.push(sucursalId);
      const idxSuc = paramsActual.length; // 4
      filtroSucVenta = `AND v.sucursal_id = $${idxSuc}`;
      filtroSucInv = `AND sucursal_id = $2`;
      filtroSucRes = `AND sucursal_id = $${idxSuc}`;
    }

    // 1. Consultas SQL analíticas en paralelo
    const [
      totalesActualRows,
      totalesAnteriorRows,
      unidadesVendidasRows,
      stockDisponibleRows,
      reservasCerradasActualRows,
      reservasCerradasAnteriorRows,
      ventasConReservaActualRows,
      ventasConReservaAnteriorRows,
      clientesActivosActualRows,
      clientesActivosAnteriorRows,
      tendenciaTemporalRows,
      distribucionPagosRows,
      topPrendasRows,
      topProveedoresRows,
      usoPlan,
      suscripcionRows,
    ] = await Promise.all([
      // 1.1 Totales período actual
      this.dataSource.query(
        `SELECT 
          COALESCE(SUM(v.total_cents), 0)::bigint AS ingresos_cents,
          COUNT(v.id)::int AS cantidad_ventas,
          COALESCE(AVG(v.total_cents), 0)::bigint AS ticket_promedio_cents
        FROM ventas v
        WHERE v.tenant_id = $1
          AND v.estado IN ('PAGADA', 'ENTREGADA')
          AND v."createdAt" >= $2 AND v."createdAt" <= $3
          ${filtroSucVenta};`,
        paramsActual,
      ) as Promise<FilaTotalesVenta[]>,

      // 1.2 Totales período anterior
      this.dataSource.query(
        `SELECT 
          COALESCE(SUM(v.total_cents), 0)::bigint AS ingresos_cents,
          COUNT(v.id)::int AS cantidad_ventas,
          COALESCE(AVG(v.total_cents), 0)::bigint AS ticket_promedio_cents
        FROM ventas v
        WHERE v.tenant_id = $1
          AND v.estado IN ('PAGADA', 'ENTREGADA')
          AND v."createdAt" >= $2 AND v."createdAt" <= $3
          ${filtroSucVenta};`,
        paramsAnterior,
      ) as Promise<FilaTotalesVenta[]>,

      // 1.3 Unidades vendidas en período actual
      this.dataSource.query(
        `SELECT COALESCE(SUM(vi.cantidad), 0)::int AS unidades_vendidas
        FROM venta_items vi
        JOIN ventas v ON vi.venta_id = v.id
        WHERE v.tenant_id = $1
          AND v.estado IN ('PAGADA', 'ENTREGADA')
          AND v."createdAt" >= $2 AND v."createdAt" <= $3
          ${filtroSucVenta};`,
        paramsActual,
      ) as Promise<FilaUnidadesVendidas[]>,

      // 1.4 Stock total disponible actual
      this.dataSource.query(
        `SELECT COALESCE(SUM(cantidad_disponible), 0)::int AS stock_disponible
        FROM inventario_sucursal
        WHERE tenant_id = $1
          ${filtroSucInv};`,
        sucursalId ? [tenantId, sucursalId] : [tenantId],
      ) as Promise<FilaStockDisponible[]>,

      // 1.5 Reservas cerradas actual
      this.dataSource.query(
        `SELECT COUNT(*)::int AS total
        FROM reservas
        WHERE tenant_id = $1
          AND estado IN ('COMPLETADA', 'NO_SHOW', 'CANCELADA', 'EXPIRADA')
          AND fecha_hora_prevista >= $2 AND fecha_hora_prevista <= $3
          ${filtroSucRes};`,
        paramsActual,
      ) as Promise<FilaConteo[]>,

      // 1.6 Reservas cerradas anterior
      this.dataSource.query(
        `SELECT COUNT(*)::int AS total
        FROM reservas
        WHERE tenant_id = $1
          AND estado IN ('COMPLETADA', 'NO_SHOW', 'CANCELADA', 'EXPIRADA')
          AND fecha_hora_prevista >= $2 AND fecha_hora_prevista <= $3
          ${filtroSucRes};`,
        paramsAnterior,
      ) as Promise<FilaConteo[]>,

      // 1.7 Ventas con reserva actual
      this.dataSource.query(
        `SELECT COUNT(v.id)::int AS total
        FROM ventas v
        WHERE v.tenant_id = $1
          AND v.estado IN ('PAGADA', 'ENTREGADA')
          AND v.reserva_id IS NOT NULL
          AND v."createdAt" >= $2 AND v."createdAt" <= $3
          ${filtroSucVenta};`,
        paramsActual,
      ) as Promise<FilaConteo[]>,

      // 1.8 Ventas con reserva anterior
      this.dataSource.query(
        `SELECT COUNT(v.id)::int AS total
        FROM ventas v
        WHERE v.tenant_id = $1
          AND v.estado IN ('PAGADA', 'ENTREGADA')
          AND v.reserva_id IS NOT NULL
          AND v."createdAt" >= $2 AND v."createdAt" <= $3
          ${filtroSucVenta};`,
        paramsAnterior,
      ) as Promise<FilaConteo[]>,

      // 1.9 Clientes activos actual
      this.dataSource.query(
        `SELECT COUNT(DISTINCT v.cliente_id)::int AS total
        FROM ventas v
        WHERE v.tenant_id = $1
          AND v.estado IN ('PAGADA', 'ENTREGADA')
          AND v.cliente_id IS NOT NULL
          AND v."createdAt" >= $2 AND v."createdAt" <= $3
          ${filtroSucVenta};`,
        paramsActual,
      ) as Promise<FilaConteo[]>,

      // 1.10 Clientes activos anterior
      this.dataSource.query(
        `SELECT COUNT(DISTINCT v.cliente_id)::int AS total
        FROM ventas v
        WHERE v.tenant_id = $1
          AND v.estado IN ('PAGADA', 'ENTREGADA')
          AND v.cliente_id IS NOT NULL
          AND v."createdAt" >= $2 AND v."createdAt" <= $3
          ${filtroSucVenta};`,
        paramsAnterior,
      ) as Promise<FilaConteo[]>,

      // 1.11 Tendencia temporal agrupada por día (Hora La Paz)
      this.dataSource.query(
        `SELECT 
          TO_CHAR((v."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'America/La_Paz'), 'YYYY-MM-DD') AS fecha,
          COALESCE(SUM(v.total_cents), 0)::bigint AS ingresos_cents,
          COUNT(v.id)::int AS ventas
        FROM ventas v
        WHERE v.tenant_id = $1
          AND v.estado IN ('PAGADA', 'ENTREGADA')
          AND v."createdAt" >= $2 AND v."createdAt" <= $3
          ${filtroSucVenta}
        GROUP BY fecha
        ORDER BY fecha ASC;`,
        paramsActual,
      ) as Promise<FilaTendencia[]>,

      // 1.12 Cuota y distribución de pasarelas de pago
      this.dataSource.query(
        `SELECT 
          COALESCE(pg.proveedor_pago, 'MANUAL') AS proveedor,
          COALESCE(pg.metodo, 'EFECTIVO') AS metodo,
          COUNT(DISTINCT v.id)::int AS transacciones,
          COALESCE(SUM(v.total_cents), 0)::bigint AS monto_cents
        FROM ventas v
        LEFT JOIN pagos pg ON pg.venta_id = v.id AND pg.estado = 'APROBADO'
        WHERE v.tenant_id = $1
          AND v.estado IN ('PAGADA', 'ENTREGADA')
          AND v."createdAt" >= $2 AND v."createdAt" <= $3
          ${filtroSucVenta}
        GROUP BY COALESCE(pg.proveedor_pago, 'MANUAL'), COALESCE(pg.metodo, 'EFECTIVO')
        ORDER BY monto_cents DESC;`,
        paramsActual,
      ) as Promise<FilaPago[]>,

      // 1.13 Top 5 prendas más vendidas (inmune a fan-out sumando subtotal_cents)
      this.dataSource.query(
        `SELECT 
          p.id AS producto_id,
          p.titulo AS nombre,
          COALESCE(c.nombre, 'General') AS categoria,
          p.imagenes->0->>'url' AS imagen_url,
          COALESCE(SUM(vi.cantidad), 0)::int AS unidades_vendidas,
          COALESCE(SUM(vi.subtotal_cents), 0)::bigint AS ingresos_cents
        FROM venta_items vi
        JOIN ventas v ON vi.venta_id = v.id
        JOIN variantes_producto vp ON vi.variante_id = vp.id
        JOIN productos p ON vp.producto_id = p.id
        LEFT JOIN categorias c ON p.categoria_id = c.id
        WHERE v.tenant_id = $1
          AND v.estado IN ('PAGADA', 'ENTREGADA')
          AND v."createdAt" >= $2 AND v."createdAt" <= $3
          ${filtroSucVenta}
        GROUP BY p.id, p.titulo, c.nombre, p.imagenes
        ORDER BY unidades_vendidas DESC, ingresos_cents DESC
        LIMIT 5;`,
        paramsActual,
      ) as Promise<FilaTopPrenda[]>,

      // 1.14 Top 5 proveedores por facturación (inmune a fan-out)
      this.dataSource.query(
        `SELECT 
          pr.id AS proveedor_id,
          pr.razon_social AS nombre,
          COALESCE(SUM(vi.subtotal_cents), 0)::bigint AS ingresos_cents,
          COALESCE(SUM(vi.cantidad), 0)::int AS unidades_vendidas
        FROM venta_items vi
        JOIN ventas v ON vi.venta_id = v.id
        JOIN variantes_producto vp ON vi.variante_id = vp.id
        JOIN productos p ON vp.producto_id = p.id
        JOIN colecciones col ON p.coleccion_id = col.id
        JOIN proveedores pr ON col.proveedor_id = pr.id
        WHERE v.tenant_id = $1
          AND v.estado IN ('PAGADA', 'ENTREGADA')
          AND v."createdAt" >= $2 AND v."createdAt" <= $3
          ${filtroSucVenta}
        GROUP BY pr.id, pr.razon_social
        ORDER BY ingresos_cents DESC
        LIMIT 5;`,
        paramsActual,
      ) as Promise<FilaTopProveedor[]>,

      // 1.15 Consumo actual de recursos SaaS
      this.usoPlanService.calcular(tenantId),

      // 1.16 Suscripción y plan actual
      this.dataSource.query(
        `SELECT s.id, s.estado, s.fin, p.nombre AS plan_nombre, p.nivel_marca,
                p.max_sucursales, p.max_productos, p.max_usuarios_staff
        FROM suscripciones s
        JOIN planes p ON s.plan_id = p.id
        WHERE s.inquilino_id = $1
        ORDER BY s."createdAt" DESC
        LIMIT 1;`,
        [tenantId],
      ) as Promise<FilaSuscripcionPlan[]>,
    ]);

    // 2. Procesar KPIs Financieros y Comparativos
    const totAct = totalesActualRows[0] ?? { ingresos_cents: 0, cantidad_ventas: 0, ticket_promedio_cents: 0 };
    const totAnt = totalesAnteriorRows[0] ?? { ingresos_cents: 0, cantidad_ventas: 0, ticket_promedio_cents: 0 };

    const ingresosCents = Number(totAct.ingresos_cents);
    const anteriorIngresosCents = Number(totAnt.ingresos_cents);
    const deltaIngresos = this.periodosService.calcularDelta(ingresosCents, anteriorIngresosCents);

    const ticketCents = Number(totAct.ticket_promedio_cents);
    const anteriorTicketCents = Number(totAnt.ticket_promedio_cents);
    const deltaTicket = this.periodosService.calcularDelta(ticketCents, anteriorTicketCents);

    // Rotación de inventario
    const unidadesVendidas = Number(unidadesVendidasRows[0]?.unidades_vendidas ?? 0);
    const stockTotalDisponible = Number(stockDisponibleRows[0]?.stock_disponible ?? 0);
    const ratioRotacion = stockTotalDisponible > 0
      ? Math.round((unidadesVendidas / stockTotalDisponible) * 100) / 100
      : 0;
    const interpretacionRotacion = ratioRotacion >= 1.2
      ? 'ALTA'
      : ratioRotacion >= 0.3
        ? 'SALUDABLE'
        : 'LENTA';

    // Conversión de reservas
    const totalReservasCerradas = Number(reservasCerradasActualRows[0]?.total ?? 0);
    const reservasConVenta = Number(ventasConReservaActualRows[0]?.total ?? 0);
    const tasaConversion = totalReservasCerradas > 0
      ? Math.round((reservasConVenta / totalReservasCerradas) * 10000) / 100
      : 0;

    const totalReservasCerradasAnt = Number(reservasCerradasAnteriorRows[0]?.total ?? 0);
    const reservasConVentaAnt = Number(ventasConReservaAnteriorRows[0]?.total ?? 0);
    const tasaConversionAnt = totalReservasCerradasAnt > 0
      ? Math.round((reservasConVentaAnt / totalReservasCerradasAnt) * 10000) / 100
      : 0;
    const deltaConversion = this.periodosService.calcularDelta(tasaConversion, tasaConversionAnt);

    // Clientes activos
    const clientesActivos = Number(clientesActivosActualRows[0]?.total ?? 0);
    const clientesActivosAnt = Number(clientesActivosAnteriorRows[0]?.total ?? 0);
    const deltaClientes = this.periodosService.calcularDelta(clientesActivos, clientesActivosAnt);

    const kpis: KpisEjecutivosDto = {
      ingresos: {
        montoCents: ingresosCents,
        montoBs: ingresosCents / 100,
        anteriorMontoCents: anteriorIngresosCents,
        variacionPorcentaje: deltaIngresos.variacionPorcentaje,
        tendencia: deltaIngresos.tendencia,
      },
      ticketPromedio: {
        montoCents: ticketCents,
        montoBs: ticketCents / 100,
        anteriorMontoCents: anteriorTicketCents,
        variacionPorcentaje: deltaTicket.variacionPorcentaje,
        tendencia: deltaTicket.tendencia,
      },
      rotacionInventario: {
        ratio: ratioRotacion,
        unidadesVendidas,
        stockTotalDisponible,
        interpretacion: interpretacionRotacion,
      },
      conversionReservas: {
        tasaPorcentaje: tasaConversion,
        reservasConVenta,
        totalReservasCerradas,
        variacionPorcentaje: deltaConversion.variacionPorcentaje,
      },
      clientesActivos: {
        cantidad: clientesActivos,
        anteriorCantidad: clientesActivosAnt,
        variacionPorcentaje: deltaClientes.variacionPorcentaje,
      },
    };

    // 3. Procesar Gráficos
    // 3.1 Tendencia de ingresos rellenando días con ceros
    const mapaIngresos = new Map<string, number>();
    const mapaVentas = new Map<string, number>();
    for (const fila of tendenciaTemporalRows) {
      mapaIngresos.set(fila.fecha, Number(fila.ingresos_cents));
      mapaVentas.set(fila.fecha, Number(fila.ventas));
    }

    const serieDias = this.periodosService.generarSerieDias(rango.desde, rango.hasta);
    const tendenciaIngresos: TendenciaIngresoDiaDto[] = serieDias.map((dia) => {
      const centavos = mapaIngresos.get(dia) ?? 0;
      return {
        fecha: dia,
        ingresosBs: centavos / 100,
        ventas: mapaVentas.get(dia) ?? 0,
      };
    });

    // 3.2 Distribución de pagos
    const totalMontoPagosCents = distribucionPagosRows.reduce((acc, r) => acc + Number(r.monto_cents), 0);
    const distribucionPagos: DistribucionPagoDto[] = distribucionPagosRows.map((r) => {
      const mCents = Number(r.monto_cents);
      const porcentaje = totalMontoPagosCents > 0
        ? Math.round((mCents / totalMontoPagosCents) * 1000) / 10
        : 0;
      return {
        proveedor: r.proveedor,
        metodo: r.metodo,
        montoBs: mCents / 100,
        porcentaje,
        transacciones: Number(r.transacciones),
      };
    });

    // 3.3 Top 5 prendas
    const topPrendas: TopPrendaDto[] = topPrendasRows.map((p) => ({
      productoId: p.producto_id,
      nombre: p.nombre,
      categoria: p.categoria,
      imagenUrl: p.imagen_url ?? null,
      unidadesVendidas: Number(p.unidades_vendidas),
      ingresosBs: Number(p.ingresos_cents) / 100,
    }));

    // 3.4 Top 5 proveedores
    const totalIngresosTopProvCents = topProveedoresRows.reduce((acc, p) => acc + Number(p.ingresos_cents), 0);
    const topProveedores: TopProveedorDto[] = topProveedoresRows.map((p) => {
      const ingCents = Number(p.ingresos_cents);
      const porcentaje = totalIngresosTopProvCents > 0
        ? Math.round((ingCents / totalIngresosTopProvCents) * 10000) / 100
        : 0;
      return {
        proveedorId: p.proveedor_id,
        nombre: p.nombre,
        ingresosBs: ingCents / 100,
        unidadesVendidas: Number(p.unidades_vendidas),
        porcentaje,
      };
    });

    // 4. Procesar Límites y Plan SaaS
    const sub = suscripcionRows[0] ?? null;
    const planNombre = sub?.plan_nombre ?? 'Boutique Pro';
    const nivelMarca = sub?.nivel_marca ?? 'COMPLETA';

    let diasRestantes = 0;
    if (sub?.fin) {
      const finDate = new Date(sub.fin);
      diasRestantes = Math.max(0, Math.ceil((finDate.getTime() - Date.now()) / (24 * 3600 * 1000)));
    }

    const calcLimite = (actual: number, maximo: number | null): LimiteRecursoPlanDto => {
      if (maximo === null || maximo <= 0) {
        return { actual, maximo: null, porcentaje: null };
      }
      const pct = Math.min(100, Math.round((actual / maximo) * 1000) / 10);
      return { actual, maximo, porcentaje: pct };
    };

    const planSaaS: PlanSaaSEjecutivoDto = {
      planNombre,
      nivelMarca,
      diasRestantes,
      limites: {
        productos: calcLimite(usoPlan.productos, sub ? sub.max_productos : 300),
        sucursales: calcLimite(usoPlan.sucursales, sub ? sub.max_sucursales : 3),
        usuariosStaff: calcLimite(usoPlan.usuariosStaff, sub ? sub.max_usuarios_staff : 10),
      },
    };

    return {
      periodo: periodoDto,
      kpis,
      graficos: {
        tendenciaIngresos,
        distribucionPagos,
        topPrendas,
        topProveedores,
      },
      planSaaS,
    };
  }
}
