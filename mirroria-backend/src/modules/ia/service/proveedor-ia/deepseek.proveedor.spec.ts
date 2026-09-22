import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import { DeepSeekProveedor } from './deepseek.proveedor.js';
import type { FichaConsultaDto } from '../../dto/ficha-consulta.dto.js';
import type { ComparacionDto } from '../../dto/reporte-response.dto.js';

function proveedor(): DeepSeekProveedor {
  const config = {
    get: (clave: string) => (clave === 'IA_API_KEY' ? 'clave-de-prueba' : undefined),
  } as unknown as ConfigService;
  return new DeepSeekProveedor(config);
}

/** Intercepta el fetch a DeepSeek y devuelve una respuesta valida minima. */
function espiarFetch(): ReturnType<typeof vi.fn> {
  const espia = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ choices: [{ message: { content: 'resumen' } }] }),
  });
  vi.stubGlobal('fetch', espia);
  return espia;
}

/** Lo que de verdad viaja por la red, que es lo unico que el modelo llega a ver. */
function cuerpoEnviado(espia: ReturnType<typeof vi.fn>): string {
  return String((espia.mock.calls[0][1] as { body: string }).body);
}

const FICHA = { metrica: 'ingresos', agruparPor: 'ninguno' } as FichaConsultaDto;
const FILAS = [{ clave: 'total', etiqueta: 'Total', valor: 60000 }];

const COMPARACION: ComparacionDto = {
  rango: { desde: '2026-07-01', hasta: '2026-07-31' },
  filas: [{ clave: 'total', etiqueta: 'Total', valor: 20000 }],
  variaciones: [
    {
      clave: 'total', etiqueta: 'Total',
      actual: 60000, anterior: 20000, deltaAbsoluto: 40000, deltaPorcentual: 200,
    },
  ],
};

describe('DeepSeekProveedor.narrar', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('con comparacion, lo que viaja al proveedor la incluye', async () => {
    const espia = espiarFetch();
    await proveedor().narrar(FICHA, FILAS, COMPARACION);

    const cuerpo = cuerpoEnviado(espia);
    // Los numeros del periodo anterior y la variacion, no solo los del actual.
    expect(cuerpo).toContain('20000');
    expect(cuerpo).toContain('40000');
    expect(cuerpo).toContain('200%');
    expect(cuerpo).toContain('2026-07-01');
    // Y la instruccion que le pide nombrarla: sin esto el modelo la ignoraba.
    expect(cuerpo).toContain('COMPARA dos periodos');
  });

  it('sin comparacion el prompt no cambia: no se le inventa un periodo anterior', async () => {
    const espia = espiarFetch();
    await proveedor().narrar(FICHA, FILAS);

    const cuerpo = cuerpoEnviado(espia);
    expect(cuerpo).toContain('60000');
    expect(cuerpo).not.toContain('COMPARA dos periodos');
    expect(cuerpo).not.toContain('Periodo de comparacion');
  });

  it('un delta porcentual nulo se manda como "sin base anterior", no como 0%', async () => {
    const espia = espiarFetch();
    await proveedor().narrar(FICHA, FILAS, {
      ...COMPARACION,
      variaciones: [
        {
          clave: 'total', etiqueta: 'Total',
          actual: 60000, anterior: 0, deltaAbsoluto: 60000, deltaPorcentual: null,
        },
      ],
    });

    // "0%" leeria como "no cambio nada", que es lo contrario de lo que paso.
    const cuerpo = cuerpoEnviado(espia);
    expect(cuerpo).toContain('sin base anterior');
    expect(cuerpo).not.toContain('null%');
  });
});

describe('DeepSeekProveedor.extraerFicha', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('pide response_format json_object: DeepSeek no soporta un schema forzado', async () => {
    const espia = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: '{"metrica":"ingresos","agruparPor":"ninguno"}' } }] }),
    });
    vi.stubGlobal('fetch', espia);

    const resultado = await proveedor().extraerFicha('cuanto vendi este mes');

    const cuerpo = JSON.parse(cuerpoEnviado(espia)) as { response_format?: { type: string } };
    expect(cuerpo.response_format).toEqual({ type: 'json_object' });
    expect(resultado).toEqual({ metrica: 'ingresos', agruparPor: 'ninguno' });
  });

  it('la instruccion enviada menciona JSON explicitamente (lo exige la API de DeepSeek)', async () => {
    const espia = espiarFetch();
    await proveedor().extraerFicha('cuanto vendi este mes')

    const cuerpo = cuerpoEnviado(espia).toLowerCase();
    expect(cuerpo).toContain('json');
  });

  it('una respuesta que no es JSON valido devuelve null, no explota', async () => {
    const espia = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: 'esto no es json' } }] }),
    });
    vi.stubGlobal('fetch', espia);

    await expect(proveedor().extraerFicha('cuanto vendi')).resolves.toBeNull();
  });
});
