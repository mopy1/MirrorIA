import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import type { CreateOrdenCompraDto } from '../dto/create-orden-compra.dto.js';
import { EstadoOrdenCompra } from '../entities/orden-compra.entity.js';
import type { OrdenesCompraService } from '../service/ordenes-compra.service.js';
import { OrdenesCompraController } from './ordenes-compra.controller.js';

describe('OrdenesCompraController', () => {
  let controller: OrdenesCompraController;
  let service: {
    create: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    findOneResponse: ReturnType<typeof vi.fn>;
    recibir: ReturnType<typeof vi.fn>;
  };

  const mockUser: JwtPayload = {
    sub: 'user-uuid-123',
    email: 'admin@mirroria.com',
    role: 'ADMIN',
    sucursalId: null,
  };

  beforeEach(() => {
    service = {
      create: vi.fn(),
      findAll: vi.fn(),
      findOneResponse: vi.fn(),
      recibir: vi.fn(),
    };
    controller = new OrdenesCompraController(
      service as unknown as OrdenesCompraService,
    );
  });

  describe('create', () => {
    it('debe usar el sub del JWT cuando usuarioId no viene en el DTO', async () => {
      const dto: CreateOrdenCompraDto = {
        proveedorId: 'prov-1',
        sucursalDestinoId: 'suc-1',
        items: [{ varianteId: 'var-1', cantidadPedida: 10 }],
      };

      const mockResponse = {
        id: 'oc-1',
        proveedorId: 'prov-1',
        sucursalDestinoId: 'suc-1',
        usuarioId: mockUser.sub,
        estado: EstadoOrdenCompra.PENDIENTE,
        items: [{ varianteId: 'var-1', cantidadPedida: 10, cantidadRecibida: 0 }],
        fechaPedido: new Date(),
        fechaEsperada: null,
        fechaRecepcion: null,
      };

      service.create.mockResolvedValue(mockResponse);

      const result = await controller.create(dto, mockUser);

      expect(service.create).toHaveBeenCalledWith({
        proveedorId: 'prov-1',
        sucursalDestinoId: 'suc-1',
        usuarioId: mockUser.sub,
        items: [{ varianteId: 'var-1', cantidadPedida: 10 }],
      });
      expect(result).toEqual(mockResponse);
    });

    it('debe respetar usuarioId si viene explícitamente en el DTO', async () => {
      const dto: CreateOrdenCompraDto = {
        proveedorId: 'prov-1',
        sucursalDestinoId: 'suc-1',
        usuarioId: 'otro-usuario-uuid',
        items: [{ varianteId: 'var-1', cantidadPedida: 5 }],
      };

      service.create.mockResolvedValue({ id: 'oc-2' });

      await controller.create(dto, mockUser);

      expect(service.create).toHaveBeenCalledWith({
        proveedorId: 'prov-1',
        sucursalDestinoId: 'suc-1',
        usuarioId: 'otro-usuario-uuid',
        items: [{ varianteId: 'var-1', cantidadPedida: 5 }],
      });
    });
  });

  describe('findAll', () => {
    it('debe retornar lista de ordenes llamando al servicio', async () => {
      const mockList = [{ id: 'oc-1' }, { id: 'oc-2' }];
      service.findAll.mockResolvedValue(mockList);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledOnce();
      expect(result).toEqual(mockList);
    });
  });

  describe('findOne', () => {
    it('debe retornar una orden por id llamando al servicio', async () => {
      const mockOrden = { id: 'oc-1' };
      service.findOneResponse.mockResolvedValue(mockOrden);

      const result = await controller.findOne('oc-1');

      expect(service.findOneResponse).toHaveBeenCalledWith('oc-1');
      expect(result).toEqual(mockOrden);
    });
  });

  describe('recibir', () => {
    it('debe delegar la recepción de la orden al servicio', async () => {
      const dto = { items: [{ varianteId: 'var-1', cantidadRecibida: 10 }] };
      const mockResult = { id: 'oc-1', estado: EstadoOrdenCompra.RECIBIDA };
      service.recibir.mockResolvedValue(mockResult);

      const result = await controller.recibir('oc-1', dto);

      expect(service.recibir).toHaveBeenCalledWith('oc-1', dto);
      expect(result).toEqual(mockResult);
    });
  });
});
