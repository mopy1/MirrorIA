import { describe, expect, it, vi } from 'vitest';
import type { DataSource } from 'typeorm';
import { MetricasTiendaService } from './metricas-tienda.service.js';

describe('MetricasTiendaService (privacidad D7: agregados sí, filas nunca)', () => {
  const consultas: Array<{ sql: string; params: unknown[] }> = [];
  const dataSource = {
    query: vi.fn(async (sql: string, params: unknown[]) => {
      consultas.push({ sql, params });
      if (sql.includes('generate_series')) {
        return [{ fecha: '2026-11-04', cantidad: 2, monto: '30000' }, { fecha: '2026-11-05', cantidad: 0, monto: '0' }];
      }
      if (sql.includes('n_mes')) return [{ n_mes: 2, m_mes: '30000', n_ant: 1, m_ant: '9900' }];
      return [{ productos: 6, staff: 2, clientas: 3, sucursales: 1, reservas: 4, ultima: new Date('2026-11-04T15:00:00Z') }];
    }),
  };
  const service = new MetricasTiendaService(dataSource as unknown as DataSource);

  it('cada consulta filtra por tenant_id = $1 con el id pedido (y ninguna sin filtro)', async () => {
    await service.calcular('tienda-x');
    expect(consultas).toHaveLength(3);
    for (const { sql, params } of consultas) {
      expect(params).toEqual(['tienda-x']);
      const tablas = sql.match(/FROM (ventas|productos|usuarios|sucursales|reservas)\b/g) ?? [];
      const filtros = sql.match(/tenant_id = \$1/g) ?? [];
      expect(filtros.length).toBeGreaterThanOrEqual(tablas.length);
      expect(sql).not.toMatch(/SELECT\s+\*/i);
    }
  });

  it('devuelve solo números agregados: ni ids, ni nombres, ni emails, ni filas', async () => {
    const m = await service.calcular('tienda-x');
    expect(m).toMatchObject({
      ventasMes: { cantidad: 2, montoCents: 30000 }, ventasMesAnterior: { cantidad: 1, montoCents: 9900 },
      ticketPromedioCents: 15000, productosActivos: 6, usuariosStaff: 2, clientas: 3, sucursalesActivas: 1, reservasMes: 4,
      ultimaVentaAt: '2026-11-04T15:00:00.000Z',
    });
    const texto = JSON.stringify(m);
    expect(texto).not.toMatch(/"(id|email|fullName|titulo|clienteId|nombre)"/);
    for (const dia of m.ventasPorDia) expect(Object.keys(dia).sort()).toEqual(['cantidad', 'fecha', 'montoCents']);
  });

  it('sin ventas en el mes, el ticket promedio es 0 (no NaN)', async () => {
    dataSource.query.mockImplementationOnce(async () => [{ n_mes: 0, m_mes: '0', n_ant: 0, m_ant: '0' }]);
    expect((await service.calcular('t')).ticketPromedioCents).toBe(0);
  });
});
