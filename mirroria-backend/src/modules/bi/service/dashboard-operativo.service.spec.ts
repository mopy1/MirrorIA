import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DataSource } from 'typeorm';
import { ForbiddenActionException } from '../../../core/exception/forbidden-action.exception.js';
import { RecursoNoEncontradoException } from '../../../core/exception/recurso-no-encontrado.exception.js';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { correrConContexto } from '../../../core/tenancy/tenant-context.js';
import { DashboardOperativoService } from './dashboard-operativo.service.js';
import { PeriodosService } from './periodos.service.js';

describe('DashboardOperativoService (Cockpit POS en piso de venta)', () => {
  const tenantFijo = '11111111-1111-4111-a111-111111111111';
  const sucursalCentralId = 'suc-central-001';
  const consultasEjecutadas: Array<{ sql: string; params: unknown[] }> = [];

  const mockDataSource = {
    query: vi.fn(async (sql: string, params: unknown[]) => {
      consultasEjecutadas.push({ sql, params });

      // Primera sucursal activa fallback
      if (sql.includes('SELECT id FROM sucursales WHERE tenant_id = $1 AND activo = true')) {
        return [{ id: sucursalCentralId }];
      }

      // Detalle sucursal
      if (sql.includes('FROM sucursales s') && sql.includes('LEFT JOIN ciudades c')) {
        const sucId = params[1];
        if (sucId === 'sucursal-inexistente') return [];
        return [{ id: String(sucId), nombre: 'Sucursal Central - Calacoto', ciudad: 'La Paz' }];
      }

      // 1. Ventas hoy
      if (sql.includes('ticket_promedio_cents') && sql.includes('FROM ventas')) {
        return [{ monto_cents: 185000, cantidad_tickets: 9, ticket_promedio_cents: 20556 }];
      }

      // 2. Cobros pendientes
      if (sql.includes("estado = 'PENDIENTE'")) {
        return [{ cantidad: 2, monto_cents: 42000 }];
      }

      // 3. Resumen reservas hoy
      if (sql.includes('por_llegar') && sql.includes('FROM reservas')) {
        return [{ total_hoy: 6, por_llegar: 3, en_tienda: 1, completadas: 2 }];
      }

      // 4. Conteo stock crítico y agotado
      if (sql.includes('COUNT(CASE WHEN cantidad_disponible = 0 THEN 1 END)::int AS agotados')) {
        return [{ criticos: 4, agotados: 1 }];
      }

      // 5. Detalle de reservas hoy
      if (sql.includes('FROM reservas r') && sql.includes('JOIN usuarios u')) {
        return [
          {
            reserva_id: 'res-901',
            hora_prevista: '14:30',
            estado: 'CONFIRMADA',
            fecha_hora_prevista: new Date(Date.now() + 45 * 60000),
            cliente: { id: 'usr-888', nombre: 'Camila Flores', telefono: 'camila@email.com' },
            prendas: [
              { nombre: 'Vestido Midi Seda Floral', talla: 'M', color: 'Rojo Rubí', cantidad: 1 },
            ],
          },
        ];
      }

      // 6. Alertas de stock crítico
      if (sql.includes('FROM inventario_sucursal inv') && sql.includes('JOIN variantes_producto vp')) {
        return [
          {
            inventario_id: 'inv-501',
            producto_id: 'prod-001',
            producto_nombre: 'Vestido Midi Seda Floral',
            talla: 'S',
            color: 'Rojo Rubí',
            cantidad_disponible: 0,
            nivel: 'AGOTADO',
          },
          {
            inventario_id: 'inv-502',
            producto_id: 'prod-002',
            producto_nombre: 'Blusa Lino Escote V',
            talla: 'L',
            color: 'Blanco',
            cantidad_disponible: 1,
            nivel: 'CRITICO',
          },
        ];
      }

      return [];
    }),
  };

  const periodosService = new PeriodosService();
  let service: DashboardOperativoService;

  beforeEach(() => {
    consultasEjecutadas.length = 0;
    vi.clearAllMocks();
    service = new DashboardOperativoService(
      mockDataSource as unknown as DataSource,
      periodosService,
    );
  });

  it('aislamiento multi-tenant estricto: todas las consultas operativas filtran por tenant_id', async () => {
    const otroTenant = '33333333-3333-4333-a333-333333333333';
    const cajeroUser: JwtPayload = {
      sub: 'usr-cajero-1',
      email: 'cajero@tienda.com',
      role: 'CAJERO',
      sucursalId: sucursalCentralId,
    };

    await correrConContexto({ tenantId: otroTenant }, async () => {
      await service.obtener(cajeroUser);
    });

    expect(consultasEjecutadas.length).toBeGreaterThan(4);
    for (const c of consultasEjecutadas) {
      expect(c.params[0]).toBe(otroTenant);
      expect(c.sql).toContain('tenant_id = $1');
    }
  });

  it('fuerza la sucursal del token JWT para personal staff (CAJERO / ENCARGADO)', async () => {
    const cajeroUser: JwtPayload = {
      sub: 'usr-cajero-1',
      email: 'cajero@tienda.com',
      role: 'CAJERO',
      sucursalId: sucursalCentralId,
    };

    const res = await service.obtener(cajeroUser, { sucursalId: 'otra-sucursal-externa' });

    // Aunque pase ?sucursalId externa, se usa sucursalCentralId del token
    expect(res.sucursal.id).toBe(sucursalCentralId);
    expect(res.sucursal.nombre).toBe('Sucursal Central - Calacoto');
    expect(res.sucursal.ciudad).toBe('La Paz');

    const consultaVentas = consultasEjecutadas.find((c) => c.sql.includes('FROM ventas'));
    expect(consultaVentas?.params[1]).toBe(sucursalCentralId);
  });

  it('permite al ADMIN consultar una sucursal específica o toma la primera por defecto', async () => {
    const adminUser: JwtPayload = {
      sub: 'usr-admin-1',
      email: 'admin@tienda.com',
      role: 'ADMIN',
      sucursalId: null,
    };

    const res = await service.obtener(adminUser, { sucursalId: 'suc-especifica-456' });
    expect(res.sucursal.id).toBe('suc-especifica-456');

    // Sin filtro, toma la primera activa del tenant
    const resSinFiltro = await service.obtener(adminUser, {});
    expect(resSinFiltro.sucursal.id).toBe(sucursalCentralId);
  });

  it('lanza RecursoNoEncontradoException si la sucursal especificada no existe', async () => {
    const adminUser: JwtPayload = {
      sub: 'usr-admin-1',
      email: 'admin@tienda.com',
      role: 'ADMIN',
      sucursalId: null,
    };

    await expect(service.obtener(adminUser, { sucursalId: 'sucursal-inexistente' })).rejects.toThrow(
      RecursoNoEncontradoException,
    );
  });

  it('retorna KPIs de hoy, agenda de reservas y alertas de percha formateadas', async () => {
    const cajeroUser: JwtPayload = {
      sub: 'usr-cajero-1',
      email: 'cajero@tienda.com',
      role: 'CAJERO',
      sucursalId: sucursalCentralId,
    };

    const res = await service.obtener(cajeroUser);

    // KPIs de ventas hoy: 185,000 cents -> 1,850.00 Bs, 9 tickets, ticket promedio 205.56 Bs
    expect(res.kpisHoy.ventas.montoCents).toBe(185000);
    expect(res.kpisHoy.ventas.montoBs).toBe(1850.0);
    expect(res.kpisHoy.ventas.cantidadTickets).toBe(9);
    expect(res.kpisHoy.ventas.ticketPromedioBs).toBe(205.56);

    // Cobros pendientes: 420.00 Bs
    expect(res.kpisHoy.cobrosPendientes.cantidad).toBe(2);
    expect(res.kpisHoy.cobrosPendientes.montoEstimadoBs).toBe(420.0);

    // Reservas hoy
    expect(res.kpisHoy.reservas.totalHoy).toBe(6);
    expect(res.kpisHoy.reservas.porLlegar).toBe(3);
    expect(res.kpisHoy.reservas.enTienda).toBe(1);
    expect(res.kpisHoy.reservas.completadas).toBe(2);

    // Stock crítico y agotado
    expect(res.kpisHoy.stock.criticos).toBe(4);
    expect(res.kpisHoy.stock.agotados).toBe(1);

    // Agenda de reservas
    expect(res.reservasHoy).toHaveLength(1);
    expect(res.reservasHoy[0].reservaId).toBe('res-901');
    expect(res.reservasHoy[0].cliente.nombre).toBe('Camila Flores');
    expect(res.reservasHoy[0].prendas[0].nombre).toBe('Vestido Midi Seda Floral');

    // Alertas de stock
    expect(res.alertasStock).toHaveLength(2);
    expect(res.alertasStock[0].nivel).toBe('AGOTADO');
    expect(res.alertasStock[0].stockDisponible).toBe(0);
    expect(res.alertasStock[1].nivel).toBe('CRITICO');
    expect(res.alertasStock[1].stockDisponible).toBe(1);
  });
});
