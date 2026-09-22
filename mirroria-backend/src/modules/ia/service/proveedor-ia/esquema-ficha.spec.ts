import { describe, expect, it } from 'vitest';
import { construirInstruccion, ESQUEMA_FICHA } from './esquema-ficha.js';
import { CATALOGO_METRICAS, METRICAS, type DefinicionMetrica } from '../catalogo-metricas.js';

describe('esquema y prompt derivados del catalogo', () => {
  it('el esquema enumera exactamente las metricas del catalogo', () => {
    expect(ESQUEMA_FICHA.properties.metrica.enum).toEqual([...METRICAS]);
  });

  it('la instruccion nombra cada metrica con sus dimensiones admitidas', () => {
    const texto = construirInstruccion();
    for (const m of METRICAS) {
      expect(texto).toContain(m);
    }
    // stock_disponible no admite dia: la instruccion no debe ofrecerlo
    const lineaStock = texto.split('\n').find((l) => l.startsWith('- stock_disponible'));
    expect(lineaStock).toBeDefined();
    expect(lineaStock).not.toContain('dia');
  });

  it('la instruccion se DERIVA del catalogo: con otro catalogo, otro texto', () => {
    // Esto es lo que garantiza que el prompt no se pueda escribir a mano y
    // quedar desfasado: si la funcion ignorara el catalogo, este texto no
    // mencionaria una metrica que no existe en el catalogo real.
    const falso = {
      metrica_inventada: {
        dominio: 'ventas',
        from: 'x',
        joinsBase: [],
        seleccion: 'COUNT(*)',
        columnaFecha: null,
        filtros: {},
        dimensiones: { ninguno: { grupo: "'t'", etiqueta: "'T'", joins: [] } },
        estadoValido: null,
        filtroEstadoPorDefecto: null,
        permiteComparacion: false,
      },
    } as unknown as Record<string, DefinicionMetrica>;

    const texto = construirInstruccion(falso);
    expect(texto).toContain('metrica_inventada');
    expect(texto).toContain('SIN fechas');      // refleja columnaFecha: null
    expect(texto).toContain('NO comparable');   // refleja permiteComparacion: false
    expect(texto).not.toContain('ingresos');    // NO filtro nada del catalogo real
  });

  it('la instruccion incluye la fecha de hoy, para que "agosto" no resuelva a un año viejo', () => {
    // Bug real encontrado en vivo (2026-09-22): sin decirle la fecha de hoy, el
    // modelo asumia "agosto" = agosto 2025 (un año de su propio entrenamiento,
    // no el actual) y la consulta volvia sin resultados. `hoy` es inyectable
    // para no depender de la fecha real del reloj en la prueba.
    const hoy = new Date('2026-09-22T12:00:00Z');
    const texto = construirInstruccion(CATALOGO_METRICAS, hoy);
    expect(texto).toContain('Hoy es 2026-09-22');
    expect(texto).toContain('agosto de 2026');
  });

  it('el esquema NO le ofrece al modelo los filtros por identificador', () => {
    // El modelo no conoce los uuid de la base, y el alcance por sucursal lo
    // impone el backend desde el JWT. Ofrecerselos seria invitarlo a inventar.
    const filtros = Object.keys(ESQUEMA_FICHA.properties.filtros.properties);
    for (const prohibido of ['sucursalId', 'categoriaId', 'productoId', 'clienteId', 'proveedorId']) {
      expect(filtros).not.toContain(prohibido);
    }
  });
});
