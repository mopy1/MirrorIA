import { describe, expect, it, vi } from 'vitest';
import type { Repository } from 'typeorm';
import { EstadoIdempotencia, Idempotencia } from './entities/idempotencia.entity.js';
import { IdempotenciaService } from './idempotencia.service.js';

describe('IdempotenciaService', () => {
  const mockRepo = {
    findOne: vi.fn(),
    create: vi.fn((data: unknown) => data),
    save: vi.fn(async (entity: unknown) => ({ id: 'uuid-1', ...(entity as object) })),
    update: vi.fn(async () => ({ affected: 1 })),
    findOneBy: vi.fn(),
    createQueryBuilder: vi.fn(),
  } as unknown as Repository<Idempotencia>;

  const service = new IdempotenciaService(mockRepo);

  it('buscar: encuentra por tenantId y clave', async () => {
    const registro = { id: 'uuid-1', tenantId: 'ten-1', clave: 'k-1' };
    vi.mocked(mockRepo.findOne).mockResolvedValueOnce(registro as unknown as Idempotencia);

    const res = await service.buscar('ten-1', 'k-1');
    expect(res).toEqual(registro);
    expect(mockRepo.findOne).toHaveBeenCalledWith({
      where: { tenantId: 'ten-1', clave: 'k-1' },
    });
  });

  it('buscar: devuelve null si no existe', async () => {
    vi.mocked(mockRepo.findOne).mockResolvedValueOnce(null);
    const res = await service.buscar('ten-1', 'k-inexistente');
    expect(res).toBeNull();
  });

  it('registrarIntento: guarda en estado EN_PROCESO y normaliza método a mayúsculas', async () => {
    const res = await service.registrarIntento({
      tenantId: 'ten-1',
      clave: 'key-100',
      ruta: '/api/v1/ventas/carrito/u1/checkout',
      metodo: 'post',
      hashCuerpo: 'hash-abc',
    });

    expect(res).toMatchObject({
      tenantId: 'ten-1',
      clave: 'key-100',
      ruta: '/api/v1/ventas/carrito/u1/checkout',
      metodo: 'POST',
      hashCuerpo: 'hash-abc',
      estado: EstadoIdempotencia.EN_PROCESO,
    });
    expect(mockRepo.create).toHaveBeenCalled();
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('validarHash: compara correctamente el hash del cuerpo', () => {
    const record = { hashCuerpo: 'hash-correcto' } as Idempotencia;
    expect(service.validarHash(record, 'hash-correcto')).toBe(true);
    expect(service.validarHash(record, 'hash-diferente')).toBe(false);
  });

  it('marcarCompletado: actualiza a COMPLETADO con código de estado y cuerpo JSON', async () => {
    await service.marcarCompletado('uuid-1', 201, { id: 'venta-1' });
    expect(mockRepo.update).toHaveBeenCalledWith('uuid-1', {
      estado: EstadoIdempotencia.COMPLETADO,
      codigoEstado: 201,
      cuerpoRespuesta: { id: 'venta-1' },
    });
  });

  it('marcarFallido: actualiza a FALLIDO con error', async () => {
    await service.marcarFallido('uuid-1', 400, { message: 'Stock insuficiente' });
    expect(mockRepo.update).toHaveBeenCalledWith('uuid-1', {
      estado: EstadoIdempotencia.FALLIDO,
      codigoEstado: 400,
      cuerpoRespuesta: { message: 'Stock insuficiente' },
    });
  });

  it('reiniciarIntento: reinicia registro FALLIDO a EN_PROCESO', async () => {
    vi.mocked(mockRepo.findOneBy).mockResolvedValueOnce({
      id: 'uuid-1',
      estado: EstadoIdempotencia.EN_PROCESO,
    } as unknown as Idempotencia);

    const res = await service.reiniciarIntento(
      'uuid-1',
      'nuevo-hash',
      '/api/v1/ventas',
      'post',
    );

    expect(res.estado).toBe(EstadoIdempotencia.EN_PROCESO);
    expect(mockRepo.update).toHaveBeenCalledWith('uuid-1', expect.objectContaining({
      estado: EstadoIdempotencia.EN_PROCESO,
      hashCuerpo: 'nuevo-hash',
      codigoEstado: null,
      cuerpoRespuesta: null,
    }));
  });

  it('limpiarExpiradas: ejecuta DELETE en QueryBuilder y retorna cantidad afectada', async () => {
    const execute = vi.fn().mockResolvedValue({ affected: 5 });
    const where = vi.fn().mockReturnValue({ execute });
    const from = vi.fn().mockReturnValue({ where });
    const deleteQb = vi.fn().mockReturnValue({ from });
    vi.mocked(mockRepo.createQueryBuilder).mockReturnValue({
      delete: deleteQb,
    } as unknown as ReturnType<typeof mockRepo.createQueryBuilder>);

    const total = await service.limpiarExpiradas();
    expect(total).toBe(5);
  });
});
