import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DataSource, Repository } from 'typeorm';
import { EstadoOrdenCompra, OrdenCompra } from '../entities/orden-compra.entity.js';
import { OrdenesCompraService } from './ordenes-compra.service.js';
import type { ProveedoresService } from '../../proveedores/service/proveedores.service.js';
import type { SucursalesService } from '../../sucursales/service/sucursales.service.js';
import type { ProductosService } from '../../catalogo/service/productos.service.js';
import type { InventarioSucursalService } from './inventario-sucursal.service.js';
import { OperacionInvalidaException } from '../../../core/exception/operacion-invalida.exception.js';
import { RecursoNoEncontradoException } from '../../../core/exception/recurso-no-encontrado.exception.js';
import { SolicitudInvalidaException } from '../../../core/exception/solicitud-invalida.exception.js';

describe('OrdenesCompraService', () => {
  let service: OrdenesCompraService;
  let ordenRepository: {
    find: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  let proveedoresService: { findOne: ReturnType<typeof vi.fn> };
  let sucursalesService: { assertExists: ReturnType<typeof vi.fn> };
  let productosService: { findVarianteById: ReturnType<typeof vi.fn> };
  let inventarioSucursalService: {
    ajustarTransito: ReturnType<typeof vi.fn>;
    ajustarStock: ReturnType<typeof vi.fn>;
  };
  let dataSource: DataSource;
  let managerRepo: {
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    ordenRepository = {
      find: vi.fn(),
      findOne: vi.fn(),
      save: vi.fn(),
      create: vi.fn(),
    };
    proveedoresService = {
      findOne: vi.fn().mockResolvedValue({ id: 'prov-1' }),
    };
    sucursalesService = {
      assertExists: vi.fn().mockResolvedValue(true),
    };
    productosService = {
      findVarianteById: vi.fn().mockResolvedValue({ id: 'var-1' }),
    };
    inventarioSucursalService = {
      ajustarTransito: vi.fn().mockResolvedValue(undefined),
      ajustarStock: vi.fn().mockResolvedValue(undefined),
    };

    managerRepo = {
      create: vi.fn((data) => ({ ...data, id: 'oc-123' })),
      save: vi.fn(async (entity) => ({ ...entity, id: entity.id || 'oc-123' })),
      findOne: vi.fn(),
    };

    dataSource = {
      transaction: vi.fn(async (callback) => {
        const fakeManager = {
          getRepository: vi.fn().mockReturnValue(managerRepo),
        };
        return callback(fakeManager);
      }),
    } as unknown as DataSource;

    service = new OrdenesCompraService(
      ordenRepository as unknown as Repository<OrdenCompra>,
      dataSource,
      proveedoresService as unknown as ProveedoresService,
      sucursalesService as unknown as SucursalesService,
      productosService as unknown as ProductosService,
      inventarioSucursalService as unknown as InventarioSucursalService,
    );
  });

  describe('create', () => {
    it('debe validar proveedor, sucursal y variantes, guardar la orden y ajustar stock en transito', async () => {
      const dto = {
        proveedorId: 'prov-1',
        sucursalDestinoId: 'suc-1',
        items: [{ varianteId: 'var-1', cantidadPedida: 20 }],
        fechaEsperada: '2099-12-01',
      };

      const result = await service.create(dto, 'usr-1');

      expect(proveedoresService.findOne).toHaveBeenCalledWith('prov-1');
      expect(sucursalesService.assertExists).toHaveBeenCalledWith('suc-1');
      expect(productosService.findVarianteById).toHaveBeenCalledWith('var-1');
      expect(managerRepo.save).toHaveBeenCalled();
      expect(inventarioSucursalService.ajustarTransito).toHaveBeenCalledWith(
        expect.anything(),
        'var-1',
        'suc-1',
        20,
      );
      expect(result.id).toBe('oc-123');
      expect(result.usuarioId).toBe('usr-1');
      expect(result.estado).toBe(EstadoOrdenCompra.PENDIENTE);
    });

    it('rechaza con 400 la misma variante repetida en la orden', async () => {
      const dto = {
        proveedorId: 'prov-1',
        sucursalDestinoId: 'suc-1',
        items: [
          { varianteId: 'var-1', cantidadPedida: 2 },
          { varianteId: 'var-1', cantidadPedida: 3 },
        ],
      };
      await expect(service.create(dto, 'usr-1')).rejects.toThrow(SolicitudInvalidaException);
      expect(managerRepo.save).not.toHaveBeenCalled();
    });

    it('rechaza con 400 una fecha esperada en el pasado', async () => {
      const dto = {
        proveedorId: 'prov-1',
        sucursalDestinoId: 'suc-1',
        items: [{ varianteId: 'var-1', cantidadPedida: 2 }],
        fechaEsperada: '2020-01-01',
      };
      await expect(service.create(dto, 'usr-1')).rejects.toThrow(SolicitudInvalidaException);
    });
  });

  describe('recibir', () => {
    it('debe arrojar OperacionInvalidaException si la orden ya está RECIBIDA', async () => {
      managerRepo.findOne.mockResolvedValue({
        id: 'oc-1',
        estado: EstadoOrdenCompra.RECIBIDA,
        items: [],
      });

      await expect(
        service.recibir('oc-1', { items: [{ varianteId: 'var-1', cantidadRecibida: 5 }] }, 'usr-2'),
      ).rejects.toThrow(OperacionInvalidaException);
    });

    it('debe arrojar RecursoNoEncontradoException si la orden no existe', async () => {
      managerRepo.findOne.mockResolvedValue(null);

      await expect(
        service.recibir('oc-inexistente', { items: [] }, 'usr-2'),
      ).rejects.toThrow(RecursoNoEncontradoException);
    });

    it('debe procesar recepción y cambiar estado a RECIBIDA cuando se recibe el total', async () => {
      const orden = {
        id: 'oc-1',
        proveedorId: 'prov-1',
        sucursalDestinoId: 'suc-1',
        usuarioId: 'usr-1',
        estado: EstadoOrdenCompra.PENDIENTE,
        items: [{ varianteId: 'var-1', cantidadPedida: 10, cantidadRecibida: 0 }],
        fechaPedido: new Date(),
        fechaEsperada: null,
        fechaRecepcion: null,
      };
      managerRepo.findOne.mockResolvedValue(orden);

      const result = await service.recibir('oc-1', {
        items: [{ varianteId: 'var-1', cantidadRecibida: 10 }],
      }, 'usr-2');

      expect(managerRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'oc-1' },
        lock: { mode: 'pessimistic_write' },
      });
      expect(inventarioSucursalService.ajustarStock).toHaveBeenCalledWith(
        expect.objectContaining({ usuarioId: 'usr-2', cantidad: 10 }),
      );
      expect(inventarioSucursalService.ajustarTransito).toHaveBeenCalledWith(
        expect.anything(),
        'var-1',
        'suc-1',
        -10,
      );
      expect(inventarioSucursalService.ajustarStock).toHaveBeenCalled();
      expect(result.estado).toBe(EstadoOrdenCompra.RECIBIDA);
      expect(result.fechaRecepcion).toBeInstanceOf(Date);
    });

    it('debe cambiar estado a RECIBIDA_PARCIAL cuando se recibe menos del total', async () => {
      const orden = {
        id: 'oc-1',
        proveedorId: 'prov-1',
        sucursalDestinoId: 'suc-1',
        usuarioId: 'usr-1',
        estado: EstadoOrdenCompra.PENDIENTE,
        items: [{ varianteId: 'var-1', cantidadPedida: 10, cantidadRecibida: 0 }],
        fechaPedido: new Date(),
        fechaEsperada: null,
        fechaRecepcion: null,
      };
      managerRepo.findOne.mockResolvedValue(orden);

      const result = await service.recibir('oc-1', {
        items: [{ varianteId: 'var-1', cantidadRecibida: 4 }],
      }, 'usr-2');

      expect(result.estado).toBe(EstadoOrdenCompra.RECIBIDA_PARCIAL);
      expect(orden.items[0].cantidadRecibida).toBe(4);
    });
  });
  describe('recibir: más de lo pendiente', () => {
    it('rechaza con 400 en vez de recortar en silencio', async () => {
      managerRepo.findOne.mockResolvedValue({
        id: 'oc-1',
        sucursalDestinoId: 'suc-1',
        estado: EstadoOrdenCompra.RECIBIDA_PARCIAL,
        items: [{ varianteId: 'var-1', cantidadPedida: 4, cantidadRecibida: 3 }],
      });
      await expect(
        service.recibir('oc-1', { items: [{ varianteId: 'var-1', cantidadRecibida: 2 }] }, 'usr-2'),
      ).rejects.toThrow(SolicitudInvalidaException);
      expect(inventarioSucursalService.ajustarStock).not.toHaveBeenCalled();
    });
  });

  describe('cancelar', () => {
    it('resta del tránsito solo lo pendiente y deja la orden CANCELADA (con lock)', async () => {
      managerRepo.findOne.mockResolvedValue({
        id: 'oc-1',
        sucursalDestinoId: 'suc-1',
        estado: EstadoOrdenCompra.RECIBIDA_PARCIAL,
        items: [
          { varianteId: 'var-1', cantidadPedida: 4, cantidadRecibida: 1 },
          { varianteId: 'var-2', cantidadPedida: 2, cantidadRecibida: 2 },
        ],
      });

      const result = await service.cancelar('oc-1');

      expect(managerRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'oc-1' },
        lock: { mode: 'pessimistic_write' },
      });
      expect(inventarioSucursalService.ajustarTransito).toHaveBeenCalledTimes(1);
      expect(inventarioSucursalService.ajustarTransito).toHaveBeenCalledWith(
        expect.anything(), 'var-1', 'suc-1', -3,
      );
      expect(result.estado).toBe(EstadoOrdenCompra.CANCELADA);
    });

    it.each([EstadoOrdenCompra.RECIBIDA, EstadoOrdenCompra.CANCELADA])(
      'rechaza (409) cancelar una orden %s',
      async (estado) => {
        managerRepo.findOne.mockResolvedValue({ id: 'oc-1', estado, items: [] });
        await expect(service.cancelar('oc-1')).rejects.toThrow(OperacionInvalidaException);
        expect(inventarioSucursalService.ajustarTransito).not.toHaveBeenCalled();
      },
    );
  });
});
