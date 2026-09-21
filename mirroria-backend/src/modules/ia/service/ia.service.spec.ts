import { describe, expect, it, vi, beforeEach } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { IaService } from './ia.service.js';
import { FichaConsultaDto } from '../dto/ficha-consulta.dto.js';
import { SinSucursalAsignadaException } from '../exception/sin-sucursal-asignada.exception.js';
import { CombinacionInvalidaException } from '../exception/combinacion-invalida.exception.js';
import type { MotorConsultaService } from './motor-consulta.service.js';

const SUCURSAL_PROPIA = '11111111-1111-1111-1111-111111111111';
const SUCURSAL_AJENA = '22222222-2222-2222-2222-222222222222';

function ficha(p: Partial<FichaConsultaDto>): FichaConsultaDto {
  return plainToInstance(FichaConsultaDto, { filtros: {}, orden: 'desc', limite: 20, ...p });
}

describe('IaService.consultar', () => {
  let motor: { ejecutar: ReturnType<typeof vi.fn> };
  let service: IaService;

  beforeEach(() => {
    motor = { ejecutar: vi.fn().mockResolvedValue([{ clave: 'x', etiqueta: 'Total', valor: 42 }]) };
    service = new IaService(motor as unknown as MotorConsultaService);
  });

  it('un ADMIN consulta la sucursal que pida', async () => {
    await service.consultar(
      ficha({ metrica: 'ingresos', agruparPor: 'ninguno', filtros: { sucursalId: SUCURSAL_AJENA } }),
      { sub: 'u1', email: 'a@a.com', role: 'ADMIN', sucursalId: SUCURSAL_PROPIA },
    );
    expect(motor.ejecutar.mock.calls[0][0].filtros.sucursalId).toBe(SUCURSAL_AJENA);
  });

  it('a un ENCARGADO_SUCURSAL se le fuerza su propia sucursal', async () => {
    await service.consultar(
      ficha({ metrica: 'ingresos', agruparPor: 'ninguno', filtros: { sucursalId: SUCURSAL_AJENA } }),
      { sub: 'u2', email: 'b@b.com', role: 'ENCARGADO_SUCURSAL', sucursalId: SUCURSAL_PROPIA },
    );
    expect(motor.ejecutar.mock.calls[0][0].filtros.sucursalId).toBe(SUCURSAL_PROPIA);
  });

  it('un ENCARGADO_SUCURSAL sin sucursal asignada es 403, no ve todo', async () => {
    // Dejar el filtro en undefined seria lo PEOR posible: sin filtro, el motor
    // devuelve TODAS las sucursales. Un encargado sin sucursal es una cuenta mal
    // configurada, y ante la duda no se le muestra nada.
    await expect(
      service.consultar(
        ficha({ metrica: 'ingresos', agruparPor: 'ninguno', filtros: { sucursalId: SUCURSAL_AJENA } }),
        { sub: 'u3', email: 'c@c.com', role: 'ENCARGADO_SUCURSAL', sucursalId: null },
      ),
    ).rejects.toThrow(SinSucursalAsignadaException);
    expect(motor.ejecutar).not.toHaveBeenCalled();
  });

  it('devuelve las filas del motor y narrativa nula sin LLM', async () => {
    const res = await service.consultar(
      ficha({ metrica: 'ingresos', agruparPor: 'ninguno' }),
      { sub: 'u1', email: 'a@a.com', role: 'ADMIN', sucursalId: null },
    );
    expect(res.filas).toHaveLength(1);
    expect(res.narrativa).toBeNull();
    expect(res.comparacion).toBeNull();
  });
});

describe('comparacion de periodos', () => {
  let motor: { ejecutar: ReturnType<typeof vi.fn> };
  let service: IaService;
  const ADMIN = { sub: 'u1', role: 'ADMIN', sucursalId: null };

  beforeEach(() => {
    motor = { ejecutar: vi.fn() };
    service = new IaService(motor as unknown as MotorConsultaService);
  });

  it('corre la misma consulta dos veces, una por rango', async () => {
    motor.ejecutar
      .mockResolvedValueOnce([{ clave: 'a', etiqueta: 'Santa Cruz', valor: 150 }])
      .mockResolvedValueOnce([{ clave: 'a', etiqueta: 'Santa Cruz', valor: 100 }]);

    const res = await service.consultar(
      ficha({
        metrica: 'ingresos', agruparPor: 'sucursal',
        filtros: { desde: '2026-08-01', hasta: '2026-08-31' },
        compararCon: { desde: '2026-07-01', hasta: '2026-07-31' },
      }),
      ADMIN,
    );

    expect(motor.ejecutar).toHaveBeenCalledTimes(2);
    expect(res.comparacion?.variaciones[0]).toMatchObject({
      actual: 150, anterior: 100, deltaAbsoluto: 50, deltaPorcentual: 50,
    });
  });

  it('una clave que no existia antes tiene anterior 0 y delta porcentual nulo', async () => {
    motor.ejecutar
      .mockResolvedValueOnce([{ clave: 'b', etiqueta: 'La Paz', valor: 80 }])
      .mockResolvedValueOnce([]);

    const res = await service.consultar(
      ficha({
        metrica: 'ingresos', agruparPor: 'sucursal',
        compararCon: { desde: '2026-07-01', hasta: '2026-07-31' },
      }),
      ADMIN,
    );

    // No dividir por cero: sin base anterior el porcentaje no existe.
    expect(res.comparacion?.variaciones[0]).toMatchObject({
      actual: 80, anterior: 0, deltaAbsoluto: 80, deltaPorcentual: null,
    });
  });

  it('rechaza comparar una metrica de inventario', async () => {
    await expect(
      service.consultar(
        ficha({
          metrica: 'stock_disponible', agruparPor: 'sucursal',
          compararCon: { desde: '2026-07-01', hasta: '2026-07-31' },
        }),
        ADMIN,
      ),
    ).rejects.toThrow(CombinacionInvalidaException);
  });

  it('sin compararCon no hay segunda consulta', async () => {
    await service.consultar(ficha({ metrica: 'ingresos', agruparPor: 'ninguno' }), ADMIN);
    expect(motor.ejecutar).toHaveBeenCalledTimes(1);
  });
});
