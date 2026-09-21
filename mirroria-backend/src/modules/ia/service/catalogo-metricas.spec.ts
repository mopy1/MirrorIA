import { describe, expect, it } from 'vitest';
import { CATALOGO_METRICAS, METRICAS } from './catalogo-metricas.js';

describe('CATALOGO_METRICAS', () => {
  it('declara las metricas de ventas e inventario de la etapa 1', () => {
    expect(METRICAS).toEqual(
      expect.arrayContaining([
        'ingresos', 'unidades', 'cantidad_ventas', 'ticket_promedio', 'descuentos',
        'stock_disponible', 'stock_reservado', 'stock_en_transito',
      ]),
    );
  });

  it('las metricas de ventas filtran estado PAGADA por defecto', () => {
    expect(CATALOGO_METRICAS.ingresos.filtroEstadoPorDefecto).toBe("v.estado = 'PAGADA'");
  });

  it('las metricas de inventario no tienen columna de fecha ni admiten comparacion', () => {
    expect(CATALOGO_METRICAS.stock_disponible.columnaFecha).toBeNull();
    expect(CATALOGO_METRICAS.stock_disponible.permiteComparacion).toBe(false);
  });

  it('inventario no admite agrupar por dia ni por mes', () => {
    const dims = Object.keys(CATALOGO_METRICAS.stock_disponible.dimensiones);
    expect(dims).not.toContain('dia');
    expect(dims).not.toContain('mes');
  });

  it('toda metrica admite agrupar por ninguno', () => {
    for (const m of METRICAS) {
      expect(CATALOGO_METRICAS[m].dimensiones.ninguno).toBeDefined();
    }
  });

  it('usa la columna createdAt entre comillas, que es como existe en la base', () => {
    // BaseEntity no declara name: y no hay namingStrategy -> la columna es camelCase.
    // Sin comillas dobles Postgres la pliega a minusculas y rompe en ejecucion.
    expect(CATALOGO_METRICAS.ingresos.columnaFecha).toBe('v."createdAt"');
    const porMes = CATALOGO_METRICAS.ingresos.dimensiones.mes;
    expect(porMes?.grupo).toContain('v."createdAt"');
    expect(porMes?.grupo).not.toContain('created_at');
  });
});

describe('metricas de kardex', () => {
  it('filtran por la columna fecha propia, no por created_at', () => {
    expect(CATALOGO_METRICAS.movimientos_unidades.columnaFecha).toBe('m.fecha');
  });

  it('admiten agrupar por tipo_movimiento', () => {
    expect(CATALOGO_METRICAS.movimientos_unidades.dimensiones.tipo_movimiento).toBeDefined();
  });

  it('las metricas de ventas NO admiten tipo_movimiento', () => {
    expect(CATALOGO_METRICAS.ingresos.dimensiones.tipo_movimiento).toBeUndefined();
  });

  it('no tienen estado por defecto: un movimiento no tiene estado', () => {
    expect(CATALOGO_METRICAS.movimientos_unidades.filtroEstadoPorDefecto).toBeNull();
  });
});
