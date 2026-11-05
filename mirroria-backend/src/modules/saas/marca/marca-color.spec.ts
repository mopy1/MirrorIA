import { describe, expect, it } from 'vitest';
import { contraste, formatearRatio, textoSobre, validarPrincipal } from './marca-color.js';

/** Tabla compartida con el front (src/lib/tema/color.test.ts): [a, b, ratio esperado ±0.05]. */
const CASOS: Array<[string, string, number]> = [
  ['#FFFFFF', '#000000', 21],
  ['#820025', '#FFFFFF', 10.6],
  ['#B4441B', '#FFFFFF', 5.55],
  ['#E3C14B', '#0A0A0A', 11.3],
  ['#F5D90A', '#FFFFFF', 1.42],
  ['#26282E', '#FFFFFF', 14.7],
];

describe('marca-color (WCAG 2.x)', () => {
  it.each(CASOS)('contraste(%s, %s) ≈ %s', (a, b, esperado) => {
    expect(contraste(a, b)).toBeCloseTo(esperado, 0);
    expect(Math.abs(contraste(a, b) - esperado)).toBeLessThan(0.1);
  });

  it('es simétrico y nunca menor que 1', () => {
    expect(contraste('#123456', '#ABCDEF')).toBeCloseTo(contraste('#ABCDEF', '#123456'), 10);
    expect(contraste('#777777', '#777777')).toBe(1);
  });

  it('textoSobre siempre deja ≥ 4.5:1 (200 colores con semilla)', () => {
    let semilla = 42;
    const azar = () => (semilla = (semilla * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
    for (let i = 0; i < 200; i++) {
      const hex = '#' + Math.floor(azar() * 0xffffff).toString(16).padStart(6, '0').toUpperCase();
      expect(contraste(hex, textoSobre(hex))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('textoSobre con #FAFAFA/#141414 NO garantizaría 4.5 (por eso blanco/negro puros)', () => {
    expect(contraste('#757575', '#FAFAFA')).toBeLessThan(4.5);
    expect(contraste('#757575', '#141414')).toBeLessThan(4.5);
    expect(contraste('#757575', textoSobre('#757575'))).toBeGreaterThanOrEqual(4.5);
  });

  it('validarPrincipal depende del modo: el amarillo de Nómada falla en claro y pasa en oscuro', () => {
    expect(validarPrincipal('#E3C14B', 'CLARO').ok).toBe(false);
    expect(validarPrincipal('#E3C14B', 'OSCURO').ok).toBe(true);
    expect(validarPrincipal('#820025', 'CLARO').ok).toBe(true);
    expect(validarPrincipal('#820025', 'OSCURO').ok).toBe(false);
  });

  it('formatearRatio trunca (4.47 nunca se muestra como 4.5)', () => {
    expect(formatearRatio(4.47)).toBe('4.4:1');
    expect(formatearRatio(1.42)).toBe('1.4:1');
  });
});
