import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Repository } from 'typeorm';
import { OperacionInvalidaException } from '../../../core/exception/operacion-invalida.exception.js';
import { RecursoNoEncontradoException } from '../../../core/exception/recurso-no-encontrado.exception.js';
import type { ProductosService } from '../../catalogo/service/productos.service.js';
import { REGLAS_COMPRA } from '../reglas-compra.js';
import { Carrito } from '../entities/carrito.entity.js';
import { CarritosService, sumarAlCarrito } from './carritos.service.js';

describe('CarritosService', () => {
  let service: CarritosService;
  let repo: {
    findOne: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    createQueryBuilder: ReturnType<typeof vi.fn>;
    manager: {
      transaction: ReturnType<typeof vi.fn>;
    };
  };
  let productosService: {
    findVarianteById: ReturnType<typeof vi.fn>;
  };
  let managerRepo: {
    findOne: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    createQueryBuilder: ReturnType<typeof vi.fn>;
  };

  const USUARIO_ID = 'user-123';
  const VARIANTE_ID = 'var-abc';

  beforeEach(() => {
    managerRepo = {
      findOne: vi.fn(),
      save: vi.fn(async (entity) => ({ ...entity, id: entity.id || 'car-1' })),
      createQueryBuilder: vi.fn(),
    };

    repo = {
      findOne: vi.fn(),
      save: vi.fn(async (entity) => ({ ...entity, id: entity.id || 'car-1' })),
      delete: vi.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: vi.fn(),
      manager: {
        transaction: vi.fn(async (callback) => {
          const fakeManager = {
            getRepository: vi.fn().mockReturnValue(managerRepo),
          };
          return callback(fakeManager);
        }),
      },
    };

    productosService = {
      findVarianteById: vi.fn().mockResolvedValue({
        id: VARIANTE_ID,
        activo: true,
        producto: { activo: true },
      }),
    };

    service = new CarritosService(
      repo as unknown as Repository<Carrito>,
      productosService as unknown as ProductosService,
    );
  });

  describe('sumarAlCarrito', () => {
    it('suma cantidades respetando el tope máximo por variante', () => {
      const actuales = [{ varianteId: 'v1', cantidad: 2 }];
      const devueltos = [{ varianteId: 'v1', cantidad: 2 }];

      const resultado = sumarAlCarrito(actuales, devueltos, 3);
      expect(resultado).toEqual([{ varianteId: 'v1', cantidad: 3 }]);
    });
  });

  describe('updateItem', () => {
    it('lanza OperacionInvalidaException si la variante no está activa', async () => {
      productosService.findVarianteById.mockResolvedValueOnce({
        id: VARIANTE_ID,
        activo: false,
        producto: { activo: true },
      });

      await expect(
        service.updateItem(USUARIO_ID, VARIANTE_ID, { cantidad: 2 }),
      ).rejects.toThrow(OperacionInvalidaException);
    });

    it('lanza OperacionInvalidaException si el producto de la variante no está activo', async () => {
      productosService.findVarianteById.mockResolvedValueOnce({
        id: VARIANTE_ID,
        activo: true,
        producto: { activo: false },
      });

      await expect(
        service.updateItem(USUARIO_ID, VARIANTE_ID, { cantidad: 2 }),
      ).rejects.toThrow(OperacionInvalidaException);
    });

    it('lanza OperacionInvalidaException si la cantidad supera el tope permitido', async () => {
      await expect(
        service.updateItem(USUARIO_ID, VARIANTE_ID, {
          cantidad: REGLAS_COMPRA.maxUnidadesPorVariante + 1,
        }),
      ).rejects.toThrow(OperacionInvalidaException);
    });

    it('lanza OperacionInvalidaException si la cantidad es menor a 1', async () => {
      await expect(
        service.updateItem(USUARIO_ID, VARIANTE_ID, { cantidad: 0 }),
      ).rejects.toThrow(OperacionInvalidaException);
    });

    it('lanza RecursoNoEncontradoException si el ítem no está en el carrito', async () => {
      const carritoEnBD = {
        id: 'car-1',
        usuarioId: USUARIO_ID,
        items: [{ varianteId: 'otra-variante', cantidad: 1 }],
      };
      managerRepo.findOne.mockResolvedValue(carritoEnBD);

      await expect(
        service.updateItem(USUARIO_ID, VARIANTE_ID, { cantidad: 2 }),
      ).rejects.toThrow(RecursoNoEncontradoException);
    });

    it('actualiza la cantidad del ítem existente y guarda el carrito', async () => {
      const carritoEnBD = {
        id: 'car-1',
        usuarioId: USUARIO_ID,
        items: [{ varianteId: VARIANTE_ID, cantidad: 1 }],
      };
      managerRepo.findOne.mockResolvedValue(carritoEnBD);

      const result = await service.updateItem(USUARIO_ID, VARIANTE_ID, { cantidad: 3 });

      expect(managerRepo.save).toHaveBeenCalledWith({
        id: 'car-1',
        usuarioId: USUARIO_ID,
        items: [{ varianteId: VARIANTE_ID, cantidad: 3 }],
      });
      expect(result).toEqual({
        id: 'car-1',
        usuarioId: USUARIO_ID,
        items: [{ varianteId: VARIANTE_ID, cantidad: 3 }],
      });
    });
  });

  describe('removeItem', () => {
    it('elimina el ítem del carrito y guarda', async () => {
      const carritoEnBD = {
        id: 'car-1',
        usuarioId: USUARIO_ID,
        items: [
          { varianteId: VARIANTE_ID, cantidad: 1 },
          { varianteId: 'v2', cantidad: 2 },
        ],
      };
      managerRepo.findOne.mockResolvedValue(carritoEnBD);

      const result = await service.removeItem(USUARIO_ID, VARIANTE_ID);

      expect(managerRepo.save).toHaveBeenCalledWith({
        id: 'car-1',
        usuarioId: USUARIO_ID,
        items: [{ varianteId: 'v2', cantidad: 2 }],
      });
      expect(result.items).toEqual([{ varianteId: 'v2', cantidad: 2 }]);
    });
  });
});
