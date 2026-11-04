import type { Repository } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecursoNoEncontradoException } from '../../../core/exception/recurso-no-encontrado.exception.js';
import type { ProveedoresService } from '../../proveedores/service/proveedores.service.js';
import type { Coleccion } from '../entities/coleccion.entity.js';
import type { Temporada } from '../entities/temporada.entity.js';
import { ColeccionesService } from './colecciones.service.js';

describe('ColeccionesService', () => {
  let coleccionRepo: { findOne: ReturnType<typeof vi.fn>; find: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
  let temporadaRepo: { findOne: ReturnType<typeof vi.fn> };
  let proveedoresService: { findOne: ReturnType<typeof vi.fn> };
  let service: ColeccionesService;

  beforeEach(() => {
    coleccionRepo = {
      findOne: vi.fn(),
      find: vi.fn(),
      save: vi.fn((c) => Promise.resolve(c)),
      create: vi.fn((c) => c),
    };
    temporadaRepo = { findOne: vi.fn() };
    proveedoresService = { findOne: vi.fn() };
    service = new ColeccionesService(
      coleccionRepo as unknown as Repository<Coleccion>,
      temporadaRepo as unknown as Repository<Temporada>,
      proveedoresService as unknown as ProveedoresService,
    );
  });

  it('update modifica proveedor y temporada correctamente', async () => {
    const colExistente = {
      id: 'c-1',
      nombre: 'Colección Verano',
      descripcion: 'Original',
      temporada: { id: 't-1' },
      proveedorId: 'prov-viejo',
      activo: true,
    } as Coleccion;

    coleccionRepo.findOne.mockResolvedValue(colExistente);
    temporadaRepo.findOne.mockResolvedValue({ id: 't-2', nombre: 'Otoño' } as Temporada);
    proveedoresService.findOne.mockResolvedValue({ id: 'prov-nuevo', razonSocial: 'Nuevo Prov' });

    const res = await service.update('c-1', {
      proveedorId: 'prov-nuevo',
      temporadaId: 't-2',
      nombre: 'Colección Editada',
    });

    expect(res.proveedorId).toBe('prov-nuevo');
    expect(res.temporadaId).toBe('t-2');
    expect(res.nombre).toBe('Colección Editada');
    expect(proveedoresService.findOne).toHaveBeenCalledWith('prov-nuevo');
    expect(coleccionRepo.save).toHaveBeenCalled();
  });

  it('update lanza 404 si la coleccion no existe', async () => {
    coleccionRepo.findOne.mockResolvedValue(null);
    await expect(service.update('inexistente', { nombre: 'Nueva' })).rejects.toBeInstanceOf(
      RecursoNoEncontradoException,
    );
  });
});
