import { describe, expect, it } from 'vitest';
import { ajustarContraste, contraste, hexAHslVar, normalizarHex, principalParaFondoClaro, validarPrincipal } from './color';
import { conBloqueos, opcional, paraGuardar, REGEX_URL_IMAGEN, validarMarca } from './marca-borrador';
import { marcaPorDefecto } from './marca.constants';

const base = () => ({ ...marcaPorDefecto('Casa Andina'), nombre: 'Casa Andina' });

describe('color', () => {
  it('normaliza hex cortos y rechaza basura', () => {
    expect(normalizarHex('#abc')).toBe('#AABBCC');
    expect(normalizarHex('820025')).toBe('#820025');
    expect(normalizarHex('rojo')).toBeNull();
  });

  it('ajustar contraste llega a 4.5:1 conservando el tono', () => {
    const claro = ajustarContraste('#F5D90A', 'CLARO');
    expect(validarPrincipal(claro, 'CLARO').ok).toBe(true);
    const oscuro = ajustarContraste('#26282E', 'OSCURO');
    expect(validarPrincipal(oscuro, 'OSCURO').ok).toBe(true);
    expect(ajustarContraste('#26282E', 'CLARO')).toBe('#26282E');
  });

  it('el principal de la app siempre se lee sobre blanco', () => {
    expect(contraste(principalParaFondoClaro('#E3C14B'), '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    expect(principalParaFondoClaro('#820025')).toBe('#820025');
  });

  it('convierte a la variable HSL de NativeWind', () => {
    expect(hexAHslVar('#FFFFFF')).toBe('0 0% 100%');
    expect(hexAHslVar('#FF0000')).toBe('0 100% 50%');
  });
});

describe('validarMarca', () => {
  it('una marca por defecto es válida', () => {
    expect(validarMarca(base())).toEqual({});
  });

  it('rechaza un principal con poco contraste y muestra el ratio', () => {
    expect(validarMarca({ ...base(), colorPrimario: '#F5D90A' }).colorPrimario).toMatch(/1\.\d:1\)\. Necesita 4\.5:1/);
  });

  it('el mismo amarillo pasa en modo oscuro', () => {
    expect(validarMarca({ ...base(), colorPrimario: '#E3C14B', modo: 'OSCURO' }).colorPrimario).toBeUndefined();
  });

  it('solo acepta https o assets propios en las imágenes', () => {
    expect(REGEX_URL_IMAGEN.test('https://images.unsplash.com/photo-1?w=1')).toBe(true);
    expect(REGEX_URL_IMAGEN.test('/images/marcas/tiendaria.svg')).toBe(true);
    for (const mala of ['http://x.com/a.jpg', 'javascript:alert(1)', 'data:image/png;base64,AA']) {
      expect(REGEX_URL_IMAGEN.test(mala)).toBe(false);
    }
  });

  it('valida largos de portada y formatos de contacto', () => {
    const b = base();
    const e = validarMarca({
      ...b,
      hero: { ...b.hero, titulo: 'Hi', ctaTexto: 'Un texto de botón demasiado largo' },
      contacto: { ...b.contacto, instagram: '@casa andina', whatsapp: '123', email: 'no' },
    });
    expect(Object.keys(e).sort()).toEqual(['contacto.email', 'contacto.instagram', 'contacto.whatsapp', 'hero.ctaTexto', 'hero.titulo']);
  });
});

describe('borrador', () => {
  it('lo que el plan no permite toma el valor efectivo', () => {
    const efectiva = marcaPorDefecto('Casa Andina');
    const b = { ...base(), fuente: 'playfair' as const, modo: 'OSCURO' as const, mostrarInsignia: false };
    const r = conBloqueos(b, efectiva, { estilo: false, imagenesSecciones: false, favicon: false, quitarInsignia: false });
    expect(r.fuente).toBe('geist');
    expect(r.modo).toBe('CLARO');
    expect(r.mostrarInsignia).toBe(true);
    const libre = conBloqueos(b, efectiva, { estilo: true, imagenesSecciones: true, favicon: true, quitarInsignia: true });
    expect(libre.fuente).toBe('playfair');
  });

  it('vacío es null y se recorta al guardar', () => {
    expect(opcional('  ')).toBeNull();
    expect(opcional('casa ')).toBe('casa ');
    expect(paraGuardar({ ...base(), nombre: ' Casa Andina ', textos: { eslogan: '  ', sobreNosotros: ' Hola ' } })).toMatchObject({
      nombre: 'Casa Andina',
      textos: { eslogan: null, sobreNosotros: 'Hola' },
    });
  });
});
