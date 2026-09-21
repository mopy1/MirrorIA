import { describe, expect, it } from 'vitest';
import { getMetadataArgsStorage } from 'typeorm';
import { InteraccionIa, TipoInteraccion } from './interaccion-ia.entity.js';

describe('InteraccionIa', () => {
  it('mapea a la tabla interacciones_ia', () => {
    const tabla = getMetadataArgsStorage().tables.find((t) => t.target === InteraccionIa);
    expect(tabla?.name).toBe('interacciones_ia');
  });

  it('declara usuario_id, tipo, input_text y output_text', () => {
    const columnas = getMetadataArgsStorage()
      .columns.filter((c) => c.target === InteraccionIa)
      .map((c) => c.options.name);
    expect(columnas).toEqual(
      expect.arrayContaining(['usuario_id', 'tipo', 'input_text', 'output_text']),
    );
  });

  it('el unico tipo en alcance es REPORTE_VOZ', () => {
    expect(Object.values(TipoInteraccion)).toEqual(['REPORTE_VOZ']);
  });
});
