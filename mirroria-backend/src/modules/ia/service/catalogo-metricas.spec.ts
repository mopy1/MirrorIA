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
});
