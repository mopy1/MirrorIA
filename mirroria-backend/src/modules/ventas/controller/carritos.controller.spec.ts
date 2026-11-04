import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import type { CarritosService } from '../service/carritos.service.js';
import { CarritosController } from './carritos.controller.js';

describe('CarritosController', () => {
  let controller: CarritosController;
  let service: {
    getCarrito: ReturnType<typeof vi.fn>;
    addItem: ReturnType<typeof vi.fn>;
    updateItem: ReturnType<typeof vi.fn>;
    removeItem: ReturnType<typeof vi.fn>;
  };

  const user: JwtPayload = {
    sub: 'user-1',
    email: 'client@mirroria.com',
    role: 'CLIENTE',
    sucursalId: null,
  };

  beforeEach(() => {
    service = {
      getCarrito: vi.fn(),
      addItem: vi.fn(),
      updateItem: vi.fn(),
      removeItem: vi.fn(),
    };
    controller = new CarritosController(service as unknown as CarritosService);
  });

  describe('updateItem', () => {
    it('llama a carritosService.updateItem cuando el usuario es el dueño', async () => {
      const mockResult = {
        id: 'c-1',
        usuarioId: 'user-1',
        items: [{ varianteId: 'v-1', cantidad: 2 }],
      };
      service.updateItem.mockResolvedValue(mockResult);

      const result = await controller.updateItem('user-1', 'v-1', { cantidad: 2 }, user);

      expect(service.updateItem).toHaveBeenCalledWith('user-1', 'v-1', { cantidad: 2 });
      expect(result).toEqual(mockResult);
    });

    it('lanza ForbiddenException si intenta editar el carrito de otro usuario', () => {
      expect(() =>
        controller.updateItem('otro-usuario', 'v-1', { cantidad: 2 }, user),
      ).toThrow(ForbiddenException);
      expect(service.updateItem).not.toHaveBeenCalled();
    });
  });
});
