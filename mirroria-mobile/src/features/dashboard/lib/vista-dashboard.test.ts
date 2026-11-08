import { describe, expect, it } from 'vitest';
import { accesosParaRol, modoInicial, modosParaRol, puedeVerInventario, sucursalParaOperativo } from './vista-rol';
import { consultaEjecutivo, consultaOperativo, fechaIsoValida, rangoListo, rangoPorDefecto } from './periodo';
import { filasPrendas, filasProveedores, mejorDia, ritmoStock, tendenciaAPuntos, usoDelPlan } from './graficos';

describe('vista por rol (igual que la web)', () => {
  it('solo ADMIN ve el resumen del negocio y puede cambiar de vista', () => {
    expect(modosParaRol('ADMIN')).toEqual(['resumen', 'tienda']);
    expect(modosParaRol('ENCARGADO_SUCURSAL')).toEqual(['tienda']);
    expect(modosParaRol('CAJERO')).toEqual(['tienda']);
    expect(modosParaRol('CUSTOMER')).toEqual([]);
    expect(modosParaRol(undefined)).toEqual([]);
  });

  it('la vista inicial respeta el rol aunque se pida otra', () => {
    expect(modoInicial('ADMIN')).toBe('resumen');
    expect(modoInicial('ADMIN', 'tienda')).toBe('tienda');
    expect(modoInicial('ADMIN', 'operativo')).toBe('tienda');
    expect(modoInicial('CAJERO', 'resumen')).toBe('tienda');
    expect(modoInicial('ENCARGADO_SUCURSAL')).toBe('tienda');
    expect(modoInicial('CUSTOMER')).toBeNull();
  });

  it('solo ADMIN elige sucursal en "Hoy en la tienda"', () => {
    expect(sucursalParaOperativo('ADMIN', 's1')).toBe('s1');
    expect(sucursalParaOperativo('CAJERO', 's1')).toBeUndefined();
    expect(sucursalParaOperativo('ENCARGADO_SUCURSAL', 's1')).toBeUndefined();
  });

  it('accesos directos con los mismos permisos que las rutas', () => {
    expect(accesosParaRol('CAJERO').map((a) => a.id)).toEqual(['mostrador', 'cobros', 'reservas']);
    expect(accesosParaRol('ENCARGADO_SUCURSAL').map((a) => a.id)).toEqual(['reservas', 'inventario']);
    expect(accesosParaRol('ADMIN')).toHaveLength(5);
    expect(accesosParaRol(undefined)).toEqual([]);
    expect(puedeVerInventario('CAJERO')).toBe(false);
    expect(puedeVerInventario('ENCARGADO_SUCURSAL')).toBe(true);
  });
});

describe('filtros del resumen', () => {
  it('valida fechas escritas a mano', () => {
    expect(fechaIsoValida('2026-11-08')).toBe(true);
    expect(fechaIsoValida('2026-02-31')).toBe(false);
    expect(fechaIsoValida('08/11/2026')).toBe(false);
    expect(fechaIsoValida(undefined)).toBe(false);
    expect(rangoListo('2026-11-01', '2026-11-08')).toBe(true);
    expect(rangoListo('2026-11-09', '2026-11-08')).toBe(false);
  });

  it('el rango por defecto son los últimos 7 días', () => {
    const r = rangoPorDefecto(Date.UTC(2026, 10, 8, 15));
    expect(r).toEqual({ desde: '2026-11-01', hasta: '2026-11-08' });
  });

  it('arma la consulta como la web: fechas solo en personalizado', () => {
    expect(consultaEjecutivo({ periodo: '30d' })).toBe('/dashboard/ejecutivo?periodo=30d');
    expect(consultaEjecutivo({ periodo: '7d', fechaInicio: '2026-01-01', sucursalId: 'abc' })).toBe(
      '/dashboard/ejecutivo?periodo=7d&sucursalId=abc'
    );
    expect(
      consultaEjecutivo({ periodo: 'personalizado', fechaInicio: '2026-11-01', fechaFin: '2026-11-08' })
    ).toBe('/dashboard/ejecutivo?periodo=personalizado&fechaInicio=2026-11-01&fechaFin=2026-11-08');
    expect(consultaOperativo()).toBe('/dashboard/operativo');
    expect(consultaOperativo('s 1')).toBe('/dashboard/operativo?sucursalId=s%201');
  });
});

describe('datos → gráficos', () => {
  const dias = [
    { fecha: '2026-11-06', ingresosBs: 100, ventas: 1 },
    { fecha: '2026-11-07', ingresosBs: 350, ventas: 2 },
    { fecha: '2026-11-08', ingresosBs: 0, ventas: 0 },
  ];

  it('la tendencia se vuelve puntos con fecha corta', () => {
    expect(tendenciaAPuntos(dias)).toEqual([
      { etiqueta: '6 nov', valor: 100 },
      { etiqueta: '7 nov', valor: 350 },
      { etiqueta: '8 nov', valor: 0 },
    ]);
    expect(tendenciaAPuntos(undefined)).toEqual([]);
  });

  it('mejor día, o null sin ventas', () => {
    expect(mejorDia(dias)?.fecha).toBe('2026-11-07');
    expect(mejorDia([{ fecha: '2026-11-08', ingresosBs: 0, ventas: 0 }])).toBeNull();
    expect(mejorDia([])).toBeNull();
  });

  it('top prendas: proporción por unidades y texto humano', () => {
    const filas = filasPrendas([
      { productoId: 'a', nombre: 'Falda', categoria: 'Faldas', imagenUrl: null, unidadesVendidas: 4, ingresosBs: 800 },
      { productoId: 'b', nombre: 'Blusa', categoria: '', imagenUrl: null, unidadesVendidas: 1, ingresosBs: 150 },
    ]);
    expect(filas[0]).toMatchObject({ proporcion: 1, detalle: '4 unidades vendidas · Faldas' });
    expect(filas[1]).toMatchObject({ proporcion: 0.25, detalle: '1 unidad vendida' });
    expect(filas[0].valor).toContain('800');
  });

  it('top proveedores: proporción por lo vendido', () => {
    const filas = filasProveedores([
      { proveedorId: 'p', nombre: 'Telar', ingresosBs: 200, unidadesVendidas: 1, porcentaje: 50 },
      { proveedorId: 'q', nombre: 'Lana', ingresosBs: 100, unidadesVendidas: 3, porcentaje: 25 },
    ]);
    expect(filas.map((f) => f.proporcion)).toEqual([1, 0.5]);
    expect(filas[0].detalle).toBe('1 prenda vendida');
  });

  it('uso del plan en palabras, con aviso cerca del límite', () => {
    const uso = usoDelPlan({
      planNombre: 'Pro',
      nivelMarca: 'x',
      diasRestantes: 10,
      limites: {
        productos: { actual: 9, maximo: null, porcentaje: null },
        sucursales: { actual: 2, maximo: 2, porcentaje: 100 },
        usuariosStaff: { actual: 1, maximo: 10, porcentaje: 10 },
      },
    });
    expect(uso[0]).toMatchObject({ texto: '9 prendas · sin límite', porcentaje: null });
    expect(uso[1]).toMatchObject({ texto: '2 de 2 sucursales', cerca: true });
    expect(uso[2]).toMatchObject({ texto: '1 de 10 personas del equipo', cerca: false });
  });

  it('ritmo de stock en palabras', () => {
    expect(ritmoStock('LENTA').etiqueta).toBe('Lento');
    expect(ritmoStock('ALTA').etiqueta).toBe('Rápido');
    expect(ritmoStock('???').etiqueta).toBe('Sin dato');
  });
});
