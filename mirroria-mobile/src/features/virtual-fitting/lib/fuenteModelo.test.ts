import { describe, it, expect } from 'vitest';
import { resolverFuenteModelo } from './fuenteModelo';

const EMPAQUETADO = 42; // lo que devuelve require('....glb')

describe('resolverFuenteModelo', () => {
  it('sin URL en el producto usa el modelo empaquetado de respaldo', () => {
    for (const vacio of [null, undefined, '', '   ']) {
      expect(resolverFuenteModelo(vacio, EMPAQUETADO)).toEqual({
        tipo: 'local',
        modulo: EMPAQUETADO,
      });
    }
  });

  it('una URL .glb del producto se carga remota', () => {
    expect(resolverFuenteModelo('https://cdn.test/vestido.glb', EMPAQUETADO)).toEqual({
      tipo: 'remoto',
      url: 'https://cdn.test/vestido.glb',
    });
  });

  it('acepta .gltf y no distingue mayusculas', () => {
    expect(resolverFuenteModelo('https://cdn.test/A.GLTF', EMPAQUETADO).tipo).toBe('remoto');
  });

  it('tolera URL firmada con query y fragmento', () => {
    // Las URL de Vercel Blob / S3 llegan con token pegado; mirar el final
    // de la cadena a secas dejaria afuera un .glb perfectamente valido.
    const firmada = 'https://cdn.test/vestido.glb?token=abc123&exp=999#frag';
    expect(resolverFuenteModelo(firmada, EMPAQUETADO)).toEqual({
      tipo: 'remoto',
      url: firmada,
    });
  });

  it('una URL que NO es glb cae al respaldo en vez de romper el visor', () => {
    // Un admin que pega el PNG de overlay en el campo equivocado no deberia
    // dejar el Vestidor en pantalla de error: GLTFLoader.parse() sobre un
    // PNG tira una excepcion cruda.
    expect(resolverFuenteModelo('https://cdn.test/foto.png', EMPAQUETADO)).toEqual({
      tipo: 'local',
      modulo: EMPAQUETADO,
    });
  });

  it('descarta una URL sin esquema http', () => {
    expect(resolverFuenteModelo('/subidas/vestido.glb', EMPAQUETADO).tipo).toBe('local');
  });
});
