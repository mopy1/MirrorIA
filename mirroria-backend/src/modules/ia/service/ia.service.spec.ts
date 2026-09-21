import { describe, expect, it, vi, beforeEach } from 'vitest';
import { plainToInstance } from 'class-transformer';
import type { Repository } from 'typeorm';
import { IaService } from './ia.service.js';
import { FichaConsultaDto } from '../dto/ficha-consulta.dto.js';
import { SinSucursalAsignadaException } from '../exception/sin-sucursal-asignada.exception.js';
import { CombinacionInvalidaException } from '../exception/combinacion-invalida.exception.js';
import { ConsultaNoComprendidaException } from '../exception/consulta-no-comprendida.exception.js';
import { IaNoConfiguradaException } from '../exception/ia-no-configurada.exception.js';
import type { MotorConsultaService } from './motor-consulta.service.js';
import type { ProveedorIa } from './proveedor-ia/proveedor-ia.interface.js';
import type { InteraccionIa } from '../entities/interaccion-ia.entity.js';

const SUCURSAL_PROPIA = '11111111-1111-1111-1111-111111111111';
const SUCURSAL_AJENA = '22222222-2222-2222-2222-222222222222';

function ficha(p: Partial<FichaConsultaDto>): FichaConsultaDto {
  return plainToInstance(FichaConsultaDto, { filtros: {}, orden: 'desc', limite: 20, ...p });
}

/** Doble minimo del proveedor de IA: nunca se llama en estos tests, pero el
 * constructor de IaService ya lo exige. */
function proveedorSinUso(): { extraerFicha: ReturnType<typeof vi.fn>; narrar: ReturnType<typeof vi.fn>; estaConfigurado: ReturnType<typeof vi.fn> } {
  return {
    extraerFicha: vi.fn(),
    narrar: vi.fn(),
    estaConfigurado: vi.fn().mockReturnValue(true),
  };
}

function repoSinUso(): { create: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> } {
  return { create: vi.fn((e) => e), save: vi.fn((e) => Promise.resolve(e)) };
}

describe('IaService.consultar', () => {
  let motor: { ejecutar: ReturnType<typeof vi.fn> };
  let service: IaService;

  beforeEach(() => {
    motor = { ejecutar: vi.fn().mockResolvedValue([{ clave: 'x', etiqueta: 'Total', valor: 42 }]) };
    service = new IaService(
      motor as unknown as MotorConsultaService,
      proveedorSinUso() as unknown as ProveedorIa,
      repoSinUso() as unknown as Repository<InteraccionIa>,
    );
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
    service = new IaService(
      motor as unknown as MotorConsultaService,
      proveedorSinUso() as unknown as ProveedorIa,
      repoSinUso() as unknown as Repository<InteraccionIa>,
    );
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

  it('la SEGUNDA consulta usa la MISMA ficha acotada, no la que pidio el usuario', async () => {
    // Sin esto, cambiar `this.motor.ejecutar(fichaEfectiva, ...)` por `ficha` deja
    // todas las demas pruebas en verde y un ENCARGADO_SUCURSAL veria OTRAS sucursales
    // en el periodo de comparacion. Se verifican las DOS llamadas, no solo la primera.
    motor.ejecutar
      .mockResolvedValueOnce([{ clave: 'a', etiqueta: 'Norte', valor: 150 }])
      .mockResolvedValueOnce([{ clave: 'a', etiqueta: 'Norte', valor: 100 }]);

    await service.consultar(
      ficha({
        metrica: 'ingresos', agruparPor: 'sucursal',
        filtros: { sucursalId: SUCURSAL_AJENA, desde: '2026-08-01', hasta: '2026-08-31' },
        compararCon: { desde: '2026-07-01', hasta: '2026-07-31' },
      }),
      { sub: 'u2', email: 'b@b.com', role: 'ENCARGADO_SUCURSAL', sucursalId: SUCURSAL_PROPIA },
    );

    expect(motor.ejecutar).toHaveBeenCalledTimes(2);
    expect(motor.ejecutar.mock.calls[0][0].filtros.sucursalId).toBe(SUCURSAL_PROPIA);
    expect(motor.ejecutar.mock.calls[1][0].filtros.sucursalId).toBe(SUCURSAL_PROPIA);
    // Y es literalmente el mismo objeto: asi es imposible que los dos periodos se
    // calculen con fichas distintas. Ver spec 4.5.
    expect(motor.ejecutar.mock.calls[1][0]).toBe(motor.ejecutar.mock.calls[0][0]);

    // Lo unico que cambia entre las dos es el rango.
    expect(motor.ejecutar.mock.calls[0][1]).toBeUndefined();
    expect(motor.ejecutar.mock.calls[1][1]).toEqual({ desde: '2026-07-01', hasta: '2026-07-31' });
  });

  it('sin compararCon no hay segunda consulta', async () => {
    await service.consultar(ficha({ metrica: 'ingresos', agruparPor: 'ninguno' }), ADMIN);
    expect(motor.ejecutar).toHaveBeenCalledTimes(1);
  });
});

describe('preguntar (con LLM)', () => {
  const ADMIN = { sub: 'u1', role: 'ADMIN', sucursalId: null };
  let motor: { ejecutar: ReturnType<typeof vi.fn> };
  let proveedor: { extraerFicha: ReturnType<typeof vi.fn>; narrar: ReturnType<typeof vi.fn>; estaConfigurado: ReturnType<typeof vi.fn> };
  let repo: { create: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> };
  let service: IaService;

  beforeEach(() => {
    motor = { ejecutar: vi.fn().mockResolvedValue([{ clave: 'sc', etiqueta: 'Santa Cruz', valor: 150000 }]) };
    proveedor = {
      extraerFicha: vi.fn().mockResolvedValue({ metrica: 'ingresos', agruparPor: 'sucursal' }),
      narrar: vi.fn().mockResolvedValue('Santa Cruz lidera con Bs 1.500.'),
      estaConfigurado: vi.fn().mockReturnValue(true),
    };
    repo = { create: vi.fn((e) => e), save: vi.fn((e) => Promise.resolve(e)) };
    service = new IaService(
      motor as unknown as MotorConsultaService,
      proveedor as unknown as ProveedorIa,
      repo as unknown as Repository<InteraccionIa>,
    );
  });

  it('traduce la pregunta, consulta y narra', async () => {
    const res = await service.preguntar({ prompt: 'cuanto vendi por sucursal' }, ADMIN);
    expect(proveedor.extraerFicha).toHaveBeenCalledWith('cuanto vendi por sucursal');
    expect(res.ficha.metrica).toBe('ingresos');
    expect(res.narrativa).toBe('Santa Cruz lidera con Bs 1.500.');
  });

  it('le pasa la comparacion a la narrativa cuando la ficha compara periodos', async () => {
    motor.ejecutar
      .mockReset()
      .mockResolvedValueOnce([{ clave: 'sc', etiqueta: 'Santa Cruz', valor: 150 }])
      .mockResolvedValueOnce([{ clave: 'sc', etiqueta: 'Santa Cruz', valor: 100 }]);
    proveedor.extraerFicha.mockResolvedValue({
      metrica: 'ingresos', agruparPor: 'sucursal',
      compararCon: { desde: '2026-07-01', hasta: '2026-07-31' },
    });

    await service.preguntar({ prompt: 'vendi mas que el mes pasado' }, ADMIN);

    // La comparacion es la RESPUESTA a esa pregunta. Pasarle solo `filas` hacia que
    // el modelo redactara sobre el mes actual como si la otra mitad no existiera.
    const comparacion = proveedor.narrar.mock.calls[0][2] as {
      variaciones: Array<Record<string, unknown>>;
    };
    expect(comparacion).toBeTruthy();
    expect(comparacion.variaciones[0]).toMatchObject({
      actual: 150, anterior: 100, deltaAbsoluto: 50, deltaPorcentual: 50,
    });
  });

  it('sin comparacion le pasa null, no una comparacion vacia', async () => {
    await service.preguntar({ prompt: 'cuanto vendi' }, ADMIN);
    expect(proveedor.narrar.mock.calls[0][2]).toBeNull();
  });

  it('registra la interaccion con el usuario del JWT', async () => {
    await service.preguntar({ prompt: 'cuanto vendi' }, ADMIN);
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ usuarioId: 'u1', inputText: 'cuanto vendi' }),
    );
  });

  it('una ficha invalida del modelo es 422, no una consulta', async () => {
    proveedor.extraerFicha.mockResolvedValue({ metrica: 'inventada', agruparPor: 'sucursal' });
    await expect(service.preguntar({ prompt: 'algo raro' }, ADMIN)).rejects.toThrow(
      ConsultaNoComprendidaException,
    );
    expect(motor.ejecutar).not.toHaveBeenCalled();
  });

  it('registra tambien la consulta que no se entendio, con output nulo', async () => {
    proveedor.extraerFicha.mockResolvedValue({ metrica: 'inventada', agruparPor: 'sucursal' });
    await expect(service.preguntar({ prompt: 'algo raro' }, ADMIN)).rejects.toThrow();
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ inputText: 'algo raro', outputText: null }),
    );
  });

  it('sin clave configurada devuelve 503', async () => {
    proveedor.estaConfigurado.mockReturnValue(false);
    await expect(service.preguntar({ prompt: 'cuanto vendi' }, ADMIN)).rejects.toThrow(
      IaNoConfiguradaException,
    );
  });

  it('si el modelo falla al narrar, devuelve el reporte con narrativa nula', async () => {
    proveedor.narrar.mockRejectedValue(new Error('red caida'));
    const res = await service.preguntar({ prompt: 'cuanto vendi' }, ADMIN);
    // Los numeros ya estaban bien: un fallo al narrar no invalida el reporte.
    expect(res.filas).toHaveLength(1);
    expect(res.narrativa).toBeNull();
  });

  it('registra la interaccion aunque la narracion falle', async () => {
    proveedor.narrar.mockRejectedValue(new Error('red caida'));
    await service.preguntar({ prompt: 'cuanto vendi' }, ADMIN);
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ inputText: 'cuanto vendi', outputText: null }),
    );
  });
});

describe('historial', () => {
  let repo: { find: ReturnType<typeof vi.fn> };
  let service: IaService;

  beforeEach(() => {
    const motor = { ejecutar: vi.fn() };
    repo = { find: vi.fn().mockResolvedValue([]) };
    service = new IaService(
      motor as unknown as MotorConsultaService,
      proveedorSinUso() as unknown as ProveedorIa,
      repo as unknown as Repository<InteraccionIa>,
    );
  });

  it('un ADMIN ve todas las interacciones', async () => {
    repo.find = vi.fn().mockResolvedValue([]);
    await service.historial({ sub: 'u1', role: 'ADMIN', sucursalId: null });
    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({ order: { createdAt: 'DESC' }, take: 50 }),
    );
    expect(repo.find.mock.calls[0][0].where).toBeUndefined();
  });

  it('un ENCARGADO_SUCURSAL solo ve las suyas', async () => {
    repo.find = vi.fn().mockResolvedValue([]);
    await service.historial({ sub: 'u2', role: 'ENCARGADO_SUCURSAL', sucursalId: 's1' });
    expect(repo.find.mock.calls[0][0].where).toEqual({ usuarioId: 'u2' });
  });

  it('no devuelve la entidad cruda sino un DTO', async () => {
    repo.find = vi.fn().mockResolvedValue([
      { id: 'i1', tipo: 'REPORTE_VOZ', inputText: 'x', outputText: 'y',
        createdAt: new Date('2026-09-21'), updatedAt: new Date('2026-09-21'), usuarioId: 'u1' },
    ]);
    const res = await service.historial({ sub: 'u1', role: 'ADMIN', sucursalId: null });
    expect(res[0]).not.toHaveProperty('updatedAt');
    expect(res[0]).not.toHaveProperty('usuarioId');
  });
});
