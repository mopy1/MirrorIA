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

  it('ingresos por categoria/producto declara la agregacion de las lineas', () => {
    // Sin seleccionAlterna, el join a venta_items que la dimension trae multiplica
    // la venta por su cantidad de lineas y SUM(v.total_cents) la cuenta entera en
    // cada categoria. El ingreso real de esas lineas es vi.subtotal_cents.
    expect(CATALOGO_METRICAS.ingresos.dimensiones.categoria?.seleccionAlterna).toBe(
      'COALESCE(SUM(vi.subtotal_cents), 0)',
    );
    expect(CATALOGO_METRICAS.ingresos.dimensiones.producto?.seleccionAlterna).toBe(
      'COALESCE(SUM(vi.subtotal_cents), 0)',
    );
  });

  it('descuentos y ticket_promedio NO ofrecen categoria ni producto', () => {
    // Viven en la cabecera de la venta y repartirlos entre lineas exigiria una regla
    // de prorrateo que nadie declaro. Se rechaza la combinacion antes que inventarla.
    for (const m of ['descuentos', 'ticket_promedio'] as const) {
      expect(CATALOGO_METRICAS[m].dimensiones.categoria).toBeUndefined();
      expect(CATALOGO_METRICAS[m].dimensiones.producto).toBeUndefined();
    }
    // Pero siguen teniendo las dimensiones de cabecera.
    expect(CATALOGO_METRICAS.descuentos.dimensiones.sucursal).toBeDefined();
    expect(CATALOGO_METRICAS.ticket_promedio.dimensiones.mes).toBeDefined();
  });

  it('toda dimension que trae venta_items agrega sobre la linea o es inmune', () => {
    // Regla general, para que una metrica nueva no repita el defecto: si la dimension
    // mete el join de venta_items, la agregacion efectiva no puede ser un SUM/AVG
    // sobre columnas de `ventas v`.
    for (const m of METRICAS) {
      const def = CATALOGO_METRICAS[m];
      for (const dim of Object.values(def.dimensiones)) {
        const traeItems = [...def.joinsBase, ...dim.joins].some((j) => j.includes('venta_items'));
        if (!traeItems) continue;
        const efectiva = dim.seleccionAlterna ?? def.seleccion;
        expect(/(SUM|AVG)\(v\./.test(efectiva), `${m} agrupado por esa dimension`).toBe(false);
      }
    }
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

describe('Fase 4: dimensiones y filtros analíticos avanzados', () => {
  it('ingresos, cantidad_ventas, ticket_promedio y descuentos admiten metodo_pago y proveedor_pago', () => {
    for (const m of ['ingresos', 'cantidad_ventas', 'ticket_promedio', 'descuentos'] as const) {
      const dims = CATALOGO_METRICAS[m].dimensiones;
      expect(dims.metodo_pago, `metodo_pago en ${m}`).toBeDefined();
      expect(dims.proveedor_pago, `proveedor_pago en ${m}`).toBeDefined();
      expect(dims.metodo_pago?.joins).toEqual([
        "LEFT JOIN pagos pg ON pg.venta_id = v.id AND pg.estado = 'APROBADO'",
      ]);
      expect(dims.metodo_pago?.grupo).toContain("CASE WHEN v.canal = 'PRESENCIAL' THEN 'EFECTIVO'");
      expect(dims.proveedor_pago?.grupo).toContain("CASE WHEN v.canal = 'PRESENCIAL' THEN 'MANUAL'");
    }
  });

  it('ingresos agrupado por proveedor define correctamente los 4 JOINs y seleccionAlterna', () => {
    const dim = CATALOGO_METRICAS.ingresos.dimensiones.proveedor;
    expect(dim).toBeDefined();
    expect(dim?.grupo).toBe('pr.id');
    expect(dim?.etiqueta).toBe('pr.razon_social');
    expect(dim?.joins).toHaveLength(4);
    expect(dim?.joins).toEqual([
      'JOIN venta_items vi ON vi.venta_id = v.id',
      'JOIN variantes_producto vp ON vp.id = vi.variante_id JOIN productos p ON p.id = vp.producto_id',
      'JOIN colecciones col ON col.id = p.coleccion_id',
      'JOIN proveedores pr ON pr.id = col.proveedor_id',
    ]);
    expect(dim?.seleccionAlterna).toBe('COALESCE(SUM(vi.subtotal_cents), 0)');
  });

  it('unidades agrupado por proveedor agrega con los JOINs desde variantes', () => {
    const dim = CATALOGO_METRICAS.unidades.dimensiones.proveedor;
    expect(dim).toBeDefined();
    expect(dim?.grupo).toBe('pr.id');
    expect(dim?.etiqueta).toBe('pr.razon_social');
    expect(dim?.joins).toEqual([
      'JOIN variantes_producto vp ON vp.id = vi.variante_id JOIN productos p ON p.id = vp.producto_id',
      'JOIN colecciones col ON col.id = p.coleccion_id',
      'JOIN proveedores pr ON pr.id = col.proveedor_id',
    ]);
  });

  it('filtros de metodoPago, proveedorPago y proveedorId en ventas', () => {
    const f = CATALOGO_METRICAS.ingresos.filtros;
    expect(f.metodoPago).toBeDefined();
    expect(f.metodoPago).toContain('EXISTS (SELECT 1 FROM pagos fpg');
    expect(f.metodoPago).toContain("v.canal = 'PRESENCIAL' AND $ = 'EFECTIVO'");

    expect(f.proveedorPago).toBeDefined();
    expect(f.proveedorPago).toContain('EXISTS (SELECT 1 FROM pagos fpg');
    expect(f.proveedorPago).toContain("v.canal = 'PRESENCIAL' AND $ = 'MANUAL'");

    expect(f.proveedorId).toBeDefined();
    expect(f.proveedorId).toContain('fcol.proveedor_id = $');
  });

  it('unidades incluye filtro proveedorId sobre variantes_producto', () => {
    const f = CATALOGO_METRICAS.unidades.filtros;
    expect(f.proveedorId).toBeDefined();
    expect(f.proveedorId).toContain('fcol.proveedor_id = $');
  });
});
