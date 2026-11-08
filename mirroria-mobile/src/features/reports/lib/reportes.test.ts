import { describe, expect, it } from 'vitest';
import { nombreArchivoReporte, payloadExportacion } from './archivo';
import { dimensionesParaMetrica, dimensionDelReporte, opcionesPivote } from './catalogo';
import { describirFallo, extraerConclusion, formatoPedido, mapHibridoAReporte, respuestaMeta } from './chat';
import { OPCIONES_INICIALES, armarFicha, calcularPeriodoAnterior, cambiarMetrica, resolverRango, tituloConstructor } from './constructor';
import { etiquetaFila, formatearPorcentaje } from './formato';
import { calcularTotales, filtrarFilas, ordenarFilas, siguienteOrden, textoConteo } from './tabla';
import type { FilaReporte, Reporte, Variacion } from '../types/reports.types';

const AHORA = new Date('2026-11-08T12:00:00Z');

describe('constructor: armado del pedido', () => {
  it('resuelve los rangos igual que la web', () => {
    expect(resolverRango('hoy', AHORA)).toEqual({ desde: '2026-11-08', hasta: '2026-11-08' });
    expect(resolverRango('ultimos_7', AHORA)).toEqual({ desde: '2026-11-01', hasta: '2026-11-08' });
    expect(resolverRango('este_mes', AHORA)).toEqual({ desde: '2026-11-01', hasta: '2026-11-08' });
    expect(resolverRango('mes_anterior', AHORA)).toEqual({ desde: '2026-10-01', hasta: '2026-10-31' });
    expect(resolverRango('mes_anterior', new Date('2026-01-15T12:00:00Z'))).toEqual({ desde: '2025-12-01', hasta: '2025-12-31' });
    expect(resolverRango('historico', AHORA)).toEqual({ desde: undefined, hasta: undefined });
  });

  it('el período anterior tiene el mismo largo y termina el día antes', () => {
    expect(calcularPeriodoAnterior('2026-11-01', '2026-11-08')).toEqual({ desde: '2026-10-24', hasta: '2026-10-31' });
    expect(calcularPeriodoAnterior(undefined, '2026-11-08')).toBeUndefined();
  });

  it('arma la ficha con filtros, orden, límite y comparación', () => {
    const ficha = armarFicha(
      { ...OPCIONES_INICIALES, metrica: 'ingresos', agruparPor: 'sucursal', sucursalId: 'suc-1', canal: 'WEB', comparar: true, orden: 'asc', limite: 5 },
      AHORA
    );
    expect(ficha).toEqual({
      metrica: 'ingresos',
      agruparPor: 'sucursal',
      filtros: { desde: '2026-11-01', hasta: '2026-11-08', sucursalId: 'suc-1', canal: 'WEB' },
      orden: 'asc',
      limite: 5,
      compararCon: { desde: '2026-10-24', hasta: '2026-10-31' },
    });
  });

  it('no manda "todas"/"todos" ni fechas al stock (es una foto de hoy)', () => {
    const ficha = armarFicha({ ...OPCIONES_INICIALES, metrica: 'stock_disponible', comparar: true }, AHORA);
    expect(ficha.filtros).toEqual({});
    expect(ficha.compararCon).toBeUndefined();
  });

  it('al cambiar de métrica reacomoda la agrupación y los filtros que no aplican', () => {
    const op = cambiarMetrica({ ...OPCIONES_INICIALES, agruparPor: 'canal', canal: 'WEB', comparar: true }, 'stock_disponible');
    expect(op.agruparPor).toBe('categoria');
    expect(op.canal).toBe('todos');
    expect(op.comparar).toBe(false);
    expect(dimensionesParaMetrica('ticket_promedio').map((d) => d.id)).not.toContain('categoria');
  });

  it('titula como la web', () => {
    expect(tituloConstructor('ingresos', 'sucursal')).toBe('Ingresos (Bs) por Sucursal');
    expect(tituloConstructor('ingresos', 'estado')).toBe('Ingresos (Bs) por Estado');
  });
});

const filas: FilaReporte[] = [
  { clave: 'a', etiqueta: 'Vestidos', valor: 300 },
  { clave: 'b', etiqueta: 'Blusas', valor: 500 },
  { clave: 'c', etiqueta: 'Árboles', valor: 100 },
];
const variaciones: Variacion[] = [
  { clave: 'a', etiqueta: 'Vestidos', actual: 300, anterior: 200, deltaAbsoluto: 100, deltaPorcentual: 50 },
  { clave: 'b', etiqueta: 'Blusas', actual: 500, anterior: 0, deltaAbsoluto: 500, deltaPorcentual: null },
  { clave: 'c', etiqueta: 'Árboles', actual: 100, anterior: 200, deltaAbsoluto: -100, deltaPorcentual: -50 },
];

describe('tabla dinámica: pivoteo, orden y filtro', () => {
  it('filtra sin tildes ni mayúsculas', () => {
    expect(filtrarFilas(filas, 'arbol').map((f) => f.clave)).toEqual(['c']);
    expect(filtrarFilas(filas, '  ')).toHaveLength(3);
    expect(filtrarFilas([{ clave: 'x', etiqueta: '2026-10-05', valor: 1 }], '5 oct', (e) => etiquetaFila(e, 'dia'))).toHaveLength(1);
  });

  it('ordena por valor, nombre, anterior y cambio', () => {
    expect(ordenarFilas(filas, 'valor', 'desc').map((f) => f.clave)).toEqual(['b', 'a', 'c']);
    expect(ordenarFilas(filas, 'etiqueta', 'asc').map((f) => f.clave)).toEqual(['c', 'b', 'a']);
    expect(ordenarFilas(filas, 'anterior', 'asc', variaciones).map((f) => f.clave)).toEqual(['b', 'a', 'c']);
    expect(ordenarFilas(filas, 'variacion', 'desc', variaciones).map((f) => f.clave)).toEqual(['a', 'c', 'b']);
  });

  it('tocar la misma columna invierte; otra arranca de mayor a menor', () => {
    expect(siguienteOrden({ columna: 'valor', direccion: 'desc' }, 'valor')).toEqual({ columna: 'valor', direccion: 'asc' });
    expect(siguienteOrden({ columna: 'valor', direccion: 'desc' }, 'etiqueta')).toEqual({ columna: 'etiqueta', direccion: 'asc' });
    expect(siguienteOrden({ columna: 'etiqueta', direccion: 'asc' }, 'anterior')).toEqual({ columna: 'anterior', direccion: 'desc' });
  });

  it('suma totales y la variación ponderada', () => {
    expect(calcularTotales(filas, variaciones)).toEqual({ total: 900, anterior: 400, delta: 125 });
    expect(calcularTotales(filas).delta).toBeNull();
    expect(textoConteo(3, 3)).toBe('3 filas');
    expect(textoConteo(1, 3)).toBe('1 de 3 filas');
  });

  it('repivotea solo por dimensiones que el backend acepta', () => {
    const ids = opcionesPivote('stock_disponible').map((o) => o.id);
    expect(ids).toEqual(['sucursal', 'categoria', 'producto']);
    expect(opcionesPivote(null)).toEqual([]);
  });

  it('lee la dimensión del agente IA en un reporte híbrido', () => {
    const r = mapHibridoAReporte({
      preguntaOriginal: 'x', narrativa: 'Hola', filas: [{ etiqueta: 'A', valor: 1 }], esSimulacion: false, metrica: 'ingresos',
      pasosEjecutados: [{ paso: 1, herramienta: 'consultar_metricas', argumentos: { metrica: 'ingresos', dimension: 'sucursal' }, resultadoResumen: '' }],
    });
    expect(r.filas[0]).toMatchObject({ clave: '0', etiqueta: 'A' });
    expect(dimensionDelReporte(r)).toBe('sucursal');
  });

  it('formatea etiquetas y porcentajes', () => {
    expect(etiquetaFila('2026-10', 'mes')).toBe('Oct 2026');
    expect(etiquetaFila('PRESENCIAL', 'canal')).toBe('En tienda');
    expect(etiquetaFila('METODO_RARO', 'canal')).toBe('Metodo raro');
    expect(formatearPorcentaje(12.54, true)).toBe('+12,5 %');
    expect(formatearPorcentaje(-3, true)).toBe('−3 %');
  });
});

describe('exportación y chat', () => {
  it('nombra el archivo como la web', () => {
    expect(nombreArchivoReporte('¿Top 5 productos más vendidos?', 'excel', AHORA)).toBe('top-5-productos-mas-vendidos_2026-11-08.xlsx');
    expect(nombreArchivoReporte('¡¡!!', 'pdf', AHORA)).toBe('reporte_2026-11-08.pdf');
  });

  it('manda lo mismo que la web al exportar', () => {
    const reporte: Reporte = { ficha: { metrica: 'ingresos', agruparPor: 'sucursal', filtros: {}, orden: 'desc', limite: 20 }, filas, comparacion: null, narrativa: 'x' };
    expect(payloadExportacion(reporte, 'T')).toEqual({ ficha: reporte.ficha, filas, comparacion: null, titulo: 'T' });
  });

  it('el 503 de IA sin configurar se muestra tal cual', () => {
    const msg = 'El asistente de reportes no esta configurado (falta IA_API_KEY).';
    expect(describirFallo(503, msg)).toEqual({ tono: 'error', reintentable: false, texto: msg });
    expect(describirFallo(0).reintentable).toBe(true);
    expect(describirFallo(422).tono).toBe('aclaracion');
  });

  it('responde las preguntas de ayuda sin IA y detecta el formato pedido', () => {
    expect(respuestaMeta('¿Qué podés hacer?')).toMatch(/Armo reportes/);
    expect(respuestaMeta('ventas por sucursal')).toBeNull();
    expect(formatoPedido('ventas en PDF')).toBe('pdf');
    expect(formatoPedido('pasamelo en una planilla')).toBe('excel');
    expect(formatoPedido('ventas')).toBeNull();
  });

  it('la conclusión corta saltea títulos, tablas e introducciones', () => {
    const md = '## Ventas\n\nResultado:\n\n| a | b |\n|---|---|\n\nVendiste **Bs 300** en Blusas, la categoría líder.\n\n¿Querés ver más?';
    expect(extraerConclusion(md)).toBe('Vendiste Bs 300 en Blusas, la categoría líder.');
  });
});
