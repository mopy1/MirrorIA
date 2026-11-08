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
    mockProveedor.chatearConTools.mockResolvedValueOnce({ contenido: 'Ventas ok', toolCalls: [] });
    const res = await service.ejecutar('como van las ventas', mockUser);
    expect(res.narrativa).toBe('Ventas ok');
    expect(res.tipoGraficoSugerido).toBe('bar');
  });

  it('ejecuta consultar_metricas con dimension producto, limite 5 y filtros mapeados', async () => {
    mockProveedor.chatearConTools
      .mockResolvedValueOnce({
        contenido: null,
        toolCalls: [{
          id: 'tc-top5',
          name: 'consultar_metricas',
          arguments: { metrica: 'unidades', dimension: 'producto', limite: 5, orden: 'desc', fechaInicio: '2026-10-01', canal: 'TIENDA_FISICA' },
        }],
      })
      .mockResolvedValueOnce({ contenido: 'El Top 5 fue Vestido Seda y Jean Denim.', toolCalls: [] });

    mockMotor.ejecutar.mockResolvedValueOnce([
      { clave: 'p1', etiqueta: 'Vestido Seda', valor: 45 },
      { clave: 'p2', etiqueta: 'Jean Denim', valor: 30 },
    ]);

    const res = await service.ejecutar('Top 5 productos más vendidos', mockUser);

    expect(mockMotor.ejecutar).toHaveBeenCalledWith({
      metrica: 'unidades',
      agruparPor: 'producto',
      limite: 5,
      orden: 'desc',
      filtros: expect.objectContaining({ desde: '2026-10-01', canal: 'TIENDA_FISICA' }),
    });
    expect(res.filas).toHaveLength(2);
    expect(res.metrica).toBe('unidades');
    expect(res.tipoGraficoSugerido).toBe('bar');
    expect(mockProveedor.chatearConTools).toHaveBeenCalledTimes(2);
    const segundoLlamado = mockProveedor.chatearConTools.mock.calls[1][0];
    const msgTool = segundoLlamado.find((m: { role: string }) => m.role === 'tool');
    expect(msgTool.content).toContain('Vestido Seda');
  });

  it('fuerza sucursalId para ENCARGADO_SUCURSAL', async () => {
    const encUser: JwtPayload = { sub: 'u2', email: 'e@m.com', role: 'ENCARGADO_SUCURSAL', sucursalId: 'suc-123' };
    mockProveedor.chatearConTools
      .mockResolvedValueOnce({
        contenido: null,
        toolCalls: [{ id: 'tc-1', name: 'consultar_metricas', arguments: { metrica: 'ingresos', dimension: 'categoria' } }],
      })
      .mockResolvedValueOnce({ contenido: 'Reporte sucursal listo', toolCalls: [] });

    mockMotor.ejecutar.mockResolvedValueOnce([{ clave: 'c1', etiqueta: 'Vestidos', valor: 500 }]);
    await service.ejecutar('ventas por categoria', encUser);

    expect(mockMotor.ejecutar).toHaveBeenCalledWith(expect.objectContaining({
      filtros: expect.objectContaining({ sucursalId: 'suc-123' }),
    }));
  });

  it('sin un dato real previo no simula sobre una base inventada', async () => {
    mockProveedor.chatearConTools
      .mockResolvedValueOnce({ contenido: null, toolCalls: [{ id: 't1', name: 'simular_what_if', arguments: { variacionPrecioPct: 15 } }] })
      .mockResolvedValueOnce({ contenido: 'Simulacion finalizada.', toolCalls: [] });

    mockDuckDb.proyectarWhatIf.mockResolvedValueOnce([
      { etiqueta: 'Base', valorOriginal: 1000, valorProyectado: 1150, deltaAbsoluto: 150, deltaPorcentual: 15 },
    ]);

    const res = await service.ejecutar('simular aumento de precio del 15%', mockUser);
    expect(res.esSimulacion).toBe(false);
    expect(mockDuckDb.proyectarWhatIf).not.toHaveBeenCalled();
    
  });
});
