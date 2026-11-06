import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DataSource } from 'typeorm';
import { correrConContexto } from '../../../core/tenancy/tenant-context.js';
import { PeriodoDashboard } from '../dto/filtro-dashboard-ejecutivo.dto.js';
import { DashboardEjecutivoService } from './dashboard-ejecutivo.service.js';
import { PeriodosService } from './periodos.service.js';
import type { UsoPlanService } from '../../saas/service/uso-plan.service.js';

describe('DashboardEjecutivoService (Métricas estratégicas y BI multi-tenant)', () => {
  const tenantFijo = '11111111-1111-4111-a111-111111111111';
  const consultasEjecutadas: Array<{ sql: string; params: unknown[] }> = [];

  const mockDataSource = {
    query: vi.fn(async (sql: string, params: unknown[]) => {
      consultasEjecutadas.push({ sql, params });

      // Consulta de nombre de sucursal
      if (sql.includes('SELECT nombre FROM sucursales')) {
        return [{ nombre: 'Sucursal Calacoto' }];
      }

      // Tendencia temporal
      if (sql.includes('GROUP BY fecha')) {
        return [
          { fecha: '2026-11-05', ingresos_cents: 125000, ventas: 7 },
          { fecha: '2026-11-06', ingresos_cents: 98000, ventas: 6 },
        ];
      }

      // Totales período actual vs anterior
      if (sql.includes('ticket_promedio_cents')) {
        if (params[1] instanceof Date && params[1].toISOString().includes('2026-10-08')) {
          return [{ ingresos_cents: 1285000, cantidad_ventas: 72, ticket_promedio_cents: 17847 }];
        }
        return [{ ingresos_cents: 1140000, cantidad_ventas: 69, ticket_promedio_cents: 16500 }];
      }

      // Unidades vendidas en período
      if (sql.includes('COALESCE(SUM(vi.cantidad), 0)::int AS unidades_vendidas')) {
        return [{ unidades_vendidas: 72 }];
      }

      // Stock disponible
      if (sql.includes('COALESCE(SUM(cantidad_disponible), 0)::int AS stock_disponible')) {
        return [{ stock_disponible: 86 }];
      }

      // Reservas cerradas
      if (sql.includes('COUNT(*)::int AS total') && sql.includes('FROM reservas')) {
        return [{ total: 16 }];
      }

      // Ventas con reserva
      if (sql.includes('COUNT(v.id)::int AS total') && sql.includes('reserva_id IS NOT NULL')) {
        return [{ total: 11 }];
      }

      // Clientes activos
      if (sql.includes('COUNT(DISTINCT v.cliente_id)::int AS total')) {
        return [{ total: 54 }];
      }

      // Tendencia temporal
      if (sql.includes('GROUP BY fecha')) {
        return [
          { fecha: '2026-11-05', ingresos_cents: 125000, ventas: 7 },
          { fecha: '2026-11-06', ingresos_cents: 98000, ventas: 6 },
        ];
      }

      // Pasarelas de pago
      if (sql.includes('COALESCE(pg.proveedor_pago, \'MANUAL\')')) {
        return [
          { proveedor: 'STRIPE', metodo: 'TARJETA', transacciones: 36, monto_cents: 642500 },
          { proveedor: 'WAYRA', metodo: 'QR', transacciones: 22, monto_cents: 385500 },
          { proveedor: 'MANUAL', metodo: 'EFECTIVO', transacciones: 14, monto_cents: 257000 },
        ];
      }

      // Top prendas
      if (sql.includes('FROM venta_items vi') && sql.includes('JOIN productos p')) {
        return [
          {
            producto_id: 'prod-1',
            nombre: 'Vestido Midi Seda',
            categoria: 'Vestidos',
            imagen_url: '/img/vestido.jpg',
            unidades_vendidas: 18,
            ingresos_cents: 396000,
          },
        ];
      }

      // Top proveedores
      if (sql.includes('JOIN proveedores pr')) {
        return [
          {
            proveedor_id: 'prov-1',
            nombre: 'Textil Andina S.R.L.',
            ingresos_cents: 612000,
            unidades_vendidas: 27,
          },
        ];
      }

      // Suscripción plan
      if (sql.includes('FROM suscripciones s')) {
        return [
          {
            id: 'sub-1',
            estado: 'ACTIVA',
            fin: new Date(Date.now() + 24 * 86400000),
            plan_nombre: 'Boutique Pro',
            nivel_marca: 'COMPLETA',
            max_sucursales: 3,
            max_productos: 300,
            max_usuarios_staff: 10,
          },
        ];
      }

      return [];
    }),
  };

  const mockUsoPlanService = {
    calcular: vi.fn(async () => ({
      sucursales: 2,
      productos: 42,
      usuariosStaff: 5,
    })),
  };

  const periodosService = new PeriodosService();
  let service: DashboardEjecutivoService;

  beforeEach(() => {
    consultasEjecutadas.length = 0;
    vi.clearAllMocks();
    service = new DashboardEjecutivoService(
      mockDataSource as unknown as DataSource,
      periodosService,
      mockUsoPlanService as unknown as UsoPlanService,
    );
  });

  it('inquebrantable aislamiento multi-tenant: todas las consultas filtran con el tenantId del contexto', async () => {
    const otroTenant = '22222222-2222-4222-a222-222222222222';
    await correrConContexto({ tenantId: otroTenant }, async () => {
      await service.obtener({ periodo: PeriodoDashboard.TREINTA_DIAS });
    });

    expect(consultasEjecutadas.length).toBeGreaterThan(5);
    for (const c of consultasEjecutadas) {
      expect(c.params[0]).toBe(otroTenant);
      expect(c.sql).toMatch(/tenant_id = \$1|inquilino_id = \$1/);
    }
    expect(mockUsoPlanService.calcular).toHaveBeenCalledWith(otroTenant);
  });

  it('calcula KPIs con precisión: ingresos en Bs, deltas %, rotación e interpretación', async () => {
    const res = await service.obtener({ periodo: PeriodoDashboard.TREINTA_DIAS });

    expect(res.periodo.clave).toBe('30d');
    expect(res.periodo.sucursalNombre).toBe('Todas las sucursales');

    // Ingresos: 1,285,000 cents -> 12,850.00 Bs
    expect(res.kpis.ingresos.montoCents).toBe(1285000);
    expect(res.kpis.ingresos.montoBs).toBe(12850.0);
    expect(res.kpis.ingresos.tendencia).toBe('POSITIVA');

    // Ticket promedio
    expect(res.kpis.ticketPromedio.montoCents).toBe(17847);
    expect(res.kpis.ticketPromedio.montoBs).toBe(178.47);

    // Rotación: 72 vendidas / 86 disponibles = 0.84 (SALUDABLE)
    expect(res.kpis.rotacionInventario.ratio).toBe(0.84);
    expect(res.kpis.rotacionInventario.unidadesVendidas).toBe(72);
    expect(res.kpis.rotacionInventario.stockTotalDisponible).toBe(86);
    expect(res.kpis.rotacionInventario.interpretacion).toBe('SALUDABLE');

    // Conversión reservas: 11 / 16 = 68.75%
    expect(res.kpis.conversionReservas.tasaPorcentaje).toBe(68.75);
    expect(res.kpis.conversionReservas.reservasConVenta).toBe(11);
    expect(res.kpis.conversionReservas.totalReservasCerradas).toBe(16);

    // Clientes activos
    expect(res.kpis.clientesActivos.cantidad).toBe(54);
  });

  it('gráfico de tendencia rellena los días intermedios con 0 ingresos cuando no hubo ventas', async () => {
    const res = await service.obtener({ periodo: PeriodoDashboard.TREINTA_DIAS });

    expect(res.graficos.tendenciaIngresos.length).toBe(30);
    // Días con venta simulada
    const dia5 = res.graficos.tendenciaIngresos.find((d) => d.fecha === '2026-11-05');
    if (dia5) {
      expect(dia5.ingresosBs).toBe(1250);
      expect(dia5.ventas).toBe(7);
    }

    // Día sin ventas (debe tener ingresosBs = 0 y ventas = 0)
    const dia0 = res.graficos.tendenciaIngresos.find((d) => d.fecha !== '2026-11-05' && d.fecha !== '2026-11-06');
    expect(dia0?.ingresosBs).toBe(0);
    expect(dia0?.ventas).toBe(0);
  });

  it('distribución de pagos calcula porcentajes y monto en Bs', async () => {
    const res = await service.obtener({ periodo: PeriodoDashboard.TREINTA_DIAS });

    expect(res.graficos.distribucionPagos).toHaveLength(3);
    const stripe = res.graficos.distribucionPagos.find((p) => p.proveedor === 'STRIPE');
    expect(stripe).toBeDefined();
    expect(stripe?.metodo).toBe('TARJETA');
    expect(stripe?.montoBs).toBe(6425.0);
    expect(stripe?.porcentaje).toBe(50.0);
  });

  it('cuota de plan SaaS muestra consumo real y días restantes', async () => {
    const res = await service.obtener({ periodo: PeriodoDashboard.TREINTA_DIAS });

    expect(res.planSaaS.planNombre).toBe('Boutique Pro');
    expect(res.planSaaS.nivelMarca).toBe('COMPLETA');
    expect(res.planSaaS.diasRestantes).toBeGreaterThan(0);

    // Límites de productos: 42 de 300 -> 14.0%
    expect(res.planSaaS.limites.productos.actual).toBe(42);
    expect(res.planSaaS.limites.productos.maximo).toBe(300);
    expect(res.planSaaS.limites.productos.porcentaje).toBe(14.0);

    // Sucursales: 2 de 3 -> 66.7%
    expect(res.planSaaS.limites.sucursales.actual).toBe(2);
    expect(res.planSaaS.limites.sucursales.porcentaje).toBe(66.7);
  });

  it('filtra por sucursal específica cuando se proporciona sucursalId', async () => {
    const sucId = '88888888-8888-4888-a888-888888888888';
    const res = await service.obtener({
      periodo: PeriodoDashboard.TREINTA_DIAS,
      sucursalId: sucId,
    });

    expect(res.periodo.sucursalId).toBe(sucId);
    expect(res.periodo.sucursalNombre).toBe('Sucursal Calacoto');

    const consultaVentas = consultasEjecutadas.find((c) => c.sql.includes('AND v.sucursal_id = $4'));
    expect(consultaVentas).toBeDefined();
    expect(consultaVentas?.params).toContain(sucId);
  });
});
