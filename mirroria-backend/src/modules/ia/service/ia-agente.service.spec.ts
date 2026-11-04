import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DataSource } from 'typeorm';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import type { DuckDbService } from './duckdb.service.js';
import { IaAgenteService } from './ia-agente.service.js';
import type { MotorConsultaService } from './motor-consulta.service.js';
import type { ProveedorIa } from './proveedor-ia/proveedor-ia.interface.js';

describe('IaAgenteService', () => {
  let service: IaAgenteService;
  let mockProveedor: { chatearConTools: ReturnType<typeof vi.fn> };
  let mockMotor: { ejecutar: ReturnType<typeof vi.fn> };
  let mockDuckDb: { proyectarWhatIf: ReturnType<typeof vi.fn> };
  let mockDataSource: { query: ReturnType<typeof vi.fn> };

  const mockUser: JwtPayload = { sub: 'usr-1', email: 'adm@m.com', role: 'ADMIN', sucursalId: null };

  beforeEach(() => {
    mockProveedor = { chatearConTools: vi.fn() };
    mockMotor = { ejecutar: vi.fn() };
    mockDuckDb = { proyectarWhatIf: vi.fn() };
    mockDataSource = { query: vi.fn() };

    service = new IaAgenteService(
      mockProveedor as unknown as ProveedorIa,
      mockMotor as unknown as MotorConsultaService,
      mockDuckDb as unknown as DuckDbService,
      mockDataSource as unknown as DataSource,
    );
  });

  it('resuelve respuesta directa cuando el modelo no invoca tools', async () => {
    mockProveedor.chatearConTools.mockResolvedValueOnce({
      contenido: 'Las ventas aumentaron un 15% este mes.',
      toolCalls: [],
    });

    const res = await service.ejecutar('como van las ventas', mockUser);

    expect(res.preguntaOriginal).toBe('como van las ventas');
    expect(res.narrativa).toBe('Las ventas aumentaron un 15% este mes.');
    expect(res.pasosEjecutados).toHaveLength(0);
    expect(res.esSimulacion).toBe(false);
  });

  it('ejecuta bucle multi-paso con metricas y simulacion what-if con DuckDB', async () => {
    mockProveedor.chatearConTools
      .mockResolvedValueOnce({
        contenido: null,
        toolCalls: [{ id: 'tc-1', name: 'consultar_metricas', arguments: { metrica: 'ventas_totales', dimension: 'sucursal' } }],
      })
      .mockResolvedValueOnce({
        contenido: null,
        toolCalls: [{ id: 'tc-2', name: 'simular_what_if', arguments: { variacionPrecioPct: 10 } }],
      })
      .mockResolvedValueOnce({
        contenido: 'Proyeccion completada: con +10% en precios se obtendria un delta positivo.',
        toolCalls: [],
      });

    mockMotor.ejecutar.mockResolvedValueOnce([
      { clave: 's1', etiqueta: 'Sucursal Central', valor: 1000 },
    ]);

    mockDuckDb.proyectarWhatIf.mockResolvedValueOnce([
      { etiqueta: 'Sucursal Central', valorOriginal: 1000, valorProyectado: 1100, deltaAbsoluto: 100, deltaPorcentual: 10 },
    ]);

    const res = await service.ejecutar('simular aumento de precio del 10%', mockUser);

    expect(mockMotor.ejecutar).toHaveBeenCalled();
    expect(mockDuckDb.proyectarWhatIf).toHaveBeenCalledWith(
      [{ etiqueta: 'Sucursal Central', valor: 1000 }],
      10,
      0,
    );
    expect(res.esSimulacion).toBe(true);
    expect(res.pasosEjecutados).toHaveLength(2);
    expect(res.filas[0].valor).toBe(1100);
    expect(res.filas[0].detalles?.deltaPct).toBe(10);
    expect(res.narrativa).toContain('Proyeccion completada');
  });

  it('ejecuta tool consultar_proveedores_stock consultando la base de datos', async () => {
    mockProveedor.chatearConTools
      .mockResolvedValueOnce({
        contenido: null,
        toolCalls: [{ id: 'tc-prov', name: 'consultar_proveedores_stock', arguments: {} }],
      })
      .mockResolvedValueOnce({
        contenido: 'Hay 20 unidades pendientes con Proveedor Textil.',
        toolCalls: [],
      });

    mockDataSource.query.mockResolvedValueOnce([
      { prov: 'Proveedor Textil', estado: 'PENDIENTE', items: [{ cantidadPedida: 25, cantidadRecibida: 5 }] },
    ]);

    const res = await service.ejecutar('cuanto stock tenemos pedido a proveedores', mockUser);

    expect(mockDataSource.query).toHaveBeenCalled();
    expect(res.pasosEjecutados).toHaveLength(1);
    expect(res.filas[0].valor).toBe(20);
    expect(res.esSimulacion).toBe(false);
  });
});
