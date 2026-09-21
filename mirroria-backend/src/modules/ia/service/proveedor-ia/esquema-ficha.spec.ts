import { describe, expect, it } from 'vitest';
import { construirInstruccion, ESQUEMA_FICHA } from './esquema-ficha.js';
import { CATALOGO_METRICAS, METRICAS } from '../catalogo-metricas.js';

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

  it('agregar una metrica al catalogo la agrega al prompt sin tocar el prompt', () => {
    // Garantia estructural: la instruccion se deriva, no se escribe a mano.
    const cantidadEnPrompt = construirInstruccion()
      .split('\n')
      .filter((l) => l.startsWith('- ')).length;
    expect(cantidadEnPrompt).toBe(Object.keys(CATALOGO_METRICAS).length);
  });
});
