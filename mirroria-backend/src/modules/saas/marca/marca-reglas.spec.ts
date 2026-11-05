import { describe, expect, it } from 'vitest';
import { validarPrincipal } from './marca-color.js';
import {
  CODIGOS_PALETA, fueraDelPlan, MARCA_TIENDA_DEMO, marcaEfectiva, marcaInicial, PALETAS, permitidoPorNivel,
  REGEX_URL_IMAGEN, restablecerSeccion,
} from './marca-reglas.js';

const premium = () => ({
  ...marcaInicial('Casa Andina', 'terracota'),
  fuente: 'playfair' as const, radio: 'RECTO' as const, modo: 'CLARO' as const,
  bannerSucursalesUrl: 'https://images.unsplash.com/photo-1?w=1', faviconUrl: '/images/marcas/x.png',
  mostrarInsignia: false,
});

describe('marca-reglas', () => {
  it('URL_IMAGEN: acepta https y /images; rechaza http, data, javascript, comillas y paréntesis', () => {
    for (const ok of ['https://images.unsplash.com/photo-1?w=1600&h=900', '/images/hero-model.webp', '/images/marcas/tiendaria.svg']) {
      expect(REGEX_URL_IMAGEN.test(ok)).toBe(true);
    }
    for (const mal of [
      'http://x.com/a.png', 'data:image/png;base64,AAAA', 'javascript:alert(1)', 'https://x.com/a".png',
      'https://x.com/a(1).png', '/images/../../etc/passwd.txt', 'https://a b.com/x.png', '//evil.com/a.png',
    ]) {
      expect(REGEX_URL_IMAGEN.test(mal)).toBe(false);
    }
  });

  it('las 6 paletas y la de Tiendaria pasan 4.5:1 sobre blanco', () => {
    for (const codigo of [...CODIGOS_PALETA, 'mirroria' as const]) {
      expect(validarPrincipal(PALETAS[codigo].primario, 'CLARO').ok).toBe(true);
      expect(REGEX_URL_IMAGEN.test(PALETAS[codigo].heroImagenUrl)).toBe(true);
    }
  });

  it('marcaInicial respeta 80 caracteres en el título y usa la paleta', () => {
    const m = marcaInicial('X'.repeat(120), 'oceano');
    expect(m.heroTitulo.length).toBe(80);
    expect(m).toMatchObject({ colorPrimario: '#0E4D74', colorAcento: '#93D4E6', modo: 'CLARO', fuente: 'geist', mostrarInsignia: true });
  });

  it('marcaEfectiva recorta por nivel sin tocar lo guardado', () => {
    const g = premium();
    const esencial = marcaEfectiva(g, 'ESENCIAL');
    expect(esencial).toMatchObject({ fuente: 'geist', radio: 'SUAVE', bannerSucursalesUrl: null, faviconUrl: null, mostrarInsignia: true });
    expect(esencial.colorPrimario).toBe(g.colorPrimario); // ESENCIAL sí incluye colores
    expect(marcaEfectiva(g, 'COMPLETA')).toMatchObject({ fuente: 'playfair', radio: 'RECTO', faviconUrl: null, mostrarInsignia: true });
    expect(marcaEfectiva(g, 'MARCA_BLANCA')).toEqual(g);
    expect(g.fuente).toBe('playfair');
  });

  it('fueraDelPlan: 409 solo si el valor difiere del apagado Y de lo ya guardado', () => {
    const base = marcaInicial('Lila');
    expect(fueraDelPlan({ ...base, fuente: 'playfair' }, base, 'ESENCIAL')).toBe('cambiar la fuente de títulos');
    expect(fueraDelPlan({ ...base, modo: 'OSCURO' }, base, 'ESENCIAL')).toBe('el modo oscuro');
    expect(fueraDelPlan({ ...base, mostrarInsignia: false }, base, 'COMPLETA')).toContain('Hecho con MirrorIA');
    expect(fueraDelPlan({ ...base, fuente: 'playfair' }, base, 'COMPLETA')).toBeNull();
    expect(fueraDelPlan({ ...base, colorPrimario: '#000000' }, base, 'ESENCIAL')).toBeNull();
    // bajó de plan: reenviar lo guardado no falla
    const guardada = premium();
    expect(fueraDelPlan({ ...guardada, eslogan: 'nuevo' }, guardada, 'ESENCIAL')).toBeNull();
  });

  it('permitidoPorNivel', () => {
    expect(permitidoPorNivel('ESENCIAL')).toEqual({ estilo: false, imagenesSecciones: false, favicon: false, quitarInsignia: false });
    expect(permitidoPorNivel('COMPLETA')).toEqual({ estilo: true, imagenesSecciones: true, favicon: false, quitarInsignia: false });
    expect(Object.values(permitidoPorNivel('MARCA_BLANCA')).every(Boolean)).toBe(true);
  });

  it('restablecer COLORES vuelve a la paleta; TODO no toca paleta; Tiendaria vuelve a lo suyo', () => {
    const g = { ...premium(), colorPrimario: '#000000', eslogan: 'hola' };
    const colores = restablecerSeccion(g, 'COLORES', marcaInicial('Casa Andina', 'terracota'));
    expect(colores).toMatchObject({ colorPrimario: '#9C3D24', fuente: 'geist', radio: 'SUAVE', eslogan: 'hola', paleta: 'terracota' });
    const todo = restablecerSeccion(g, 'TODO', marcaInicial('Casa Andina', 'terracota'));
    expect(todo).toEqual(marcaInicial('Casa Andina', 'terracota'));
    const demo = restablecerSeccion({ ...MARCA_TIENDA_DEMO, imagenProbadorUrl: null }, 'IMAGENES', MARCA_TIENDA_DEMO);
    expect(demo.imagenProbadorUrl).toBe(MARCA_TIENDA_DEMO.imagenProbadorUrl);
  });
});
