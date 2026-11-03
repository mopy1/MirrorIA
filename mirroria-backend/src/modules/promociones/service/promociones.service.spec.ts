import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Repository } from 'typeorm';
import { PromocionesService } from './promociones.service.js';
import { Cupon, TipoDescuentoCupon } from '../entities/cupon.entity.js';

describe('PromocionesService', () => {
  let service: PromocionesService;
  let mockCuponRepo: Partial<Repository<Cupon>>;
  // UPDATE atómico: se simula el query builder y cuántas filas afecta.
  let qb: Record<string, ReturnType<typeof vi.fn>>;
  let filasAfectadas: number;

  beforeEach(() => {
    filasAfectadas = 1;
    qb = {} as typeof qb;
    for (const m of ['update', 'set', 'where', 'andWhere']) qb[m] = vi.fn(() => qb);
    qb.execute = vi.fn(() => Promise.resolve({ affected: filasAfectadas }));
    mockCuponRepo = {
      createQueryBuilder: vi.fn(() => qb) as never,
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn((entity) => entity as Cupon),
      save: vi.fn((entity) => Promise.resolve(entity as Cupon)),
    };
    service = new PromocionesService(mockCuponRepo as Repository<Cupon>);
  });

  describe('validar', () => {
    it('debe calcular descuento porcentual correctamente', async () => {
      const cuponMock: Cupon = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        codigo: 'VERANO20',
        tipoDescuento: TipoDescuentoCupon.PORCENTAJE,
        valor: 20, // 20%
        fechaInicio: new Date(Date.now() - 86400000), // ayer
        fechaFin: new Date(Date.now() + 86400000), // mañana
        usosMaximos: 100,
        usosActuales: 5,
        montoMinimoCents: null,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(service, 'findByCodigo').mockResolvedValue(cuponMock);

      const resultado = await service.validar('VERANO20', 10000); // 100.00 Bs
      expect(resultado.valido).toBe(true);
      expect(resultado.descuentoCents).toBe(2000); // 20.00 Bs
      expect(resultado.totalConDescuentoCents).toBe(8000); // 80.00 Bs
    });

    it('debe calcular descuento de monto fijo correctamente sin exceder el subtotal', async () => {
      const cuponMock: Cupon = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        codigo: 'DESCUENTO50',
        tipoDescuento: TipoDescuentoCupon.MONTO_FIJO,
        valor: 5000, // 50.00 Bs
        fechaInicio: new Date(Date.now() - 86400000),
        fechaFin: new Date(Date.now() + 86400000),
        usosMaximos: null,
        usosActuales: 0,
        montoMinimoCents: null,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(service, 'findByCodigo').mockResolvedValue(cuponMock);

      // Si el subtotal es 30.00 Bs y el cupón es de 50.00 Bs, el descuento no debe exceder 30.00 Bs
      const resultado = await service.validar('DESCUENTO50', 3000);
      expect(resultado.valido).toBe(true);
      expect(resultado.descuentoCents).toBe(3000);
      expect(resultado.totalConDescuentoCents).toBe(0);
    });

    it('debe rechazar cupón si está inactivo', async () => {
      const cuponMock: Cupon = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        codigo: 'INACTIVO',
        tipoDescuento: TipoDescuentoCupon.PORCENTAJE,
        valor: 10,
        fechaInicio: new Date(Date.now() - 86400000),
        fechaFin: new Date(Date.now() + 86400000),
        usosMaximos: 10,
        usosActuales: 0,
        montoMinimoCents: null,
        activo: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(service, 'findByCodigo').mockResolvedValue(cuponMock);

      const resultado = await service.validar('INACTIVO', 10000);
      expect(resultado.valido).toBe(false);
      expect(resultado.mensaje).toContain('inactivo');
      expect(resultado.descuentoCents).toBe(0);
    });

    it('debe rechazar cupón si superó el límite de usos', async () => {
      const cuponMock: Cupon = {
        id: '123e4567-e89b-12d3-a456-426614174003',
        codigo: 'AGOTADO',
        tipoDescuento: TipoDescuentoCupon.PORCENTAJE,
        valor: 15,
        fechaInicio: new Date(Date.now() - 86400000),
        fechaFin: new Date(Date.now() + 86400000),
        usosMaximos: 5,
        usosActuales: 5,
        montoMinimoCents: null,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(service, 'findByCodigo').mockResolvedValue(cuponMock);

      const resultado = await service.validar('AGOTADO', 10000);
      expect(resultado.valido).toBe(false);
      expect(resultado.mensaje).toContain('límite máximo');
    });

    it('debe rechazar cupón si el subtotal no alcanza el monto mínimo', async () => {
      const cuponMock: Cupon = {
        id: '123e4567-e89b-12d3-a456-426614174004',
        codigo: 'VIP200',
        tipoDescuento: TipoDescuentoCupon.PORCENTAJE,
        valor: 20,
        fechaInicio: new Date(Date.now() - 86400000),
        fechaFin: new Date(Date.now() + 86400000),
        usosMaximos: null,
        usosActuales: 0,
        montoMinimoCents: 20000, // 200.00 Bs
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(service, 'findByCodigo').mockResolvedValue(cuponMock);

      const resultado = await service.validar('VIP200', 15000); // 150.00 Bs
      expect(resultado.valido).toBe(false);
      expect(resultado.mensaje).toContain('compra mínima');
    });
  });

  describe('consumirCupon', () => {
    it('debe incrementar usosActuales y retornar descuento', async () => {
      const cuponMock: Cupon = {
        id: '123e4567-e89b-12d3-a456-426614174005',
        codigo: 'PROMO10',
        tipoDescuento: TipoDescuentoCupon.PORCENTAJE,
        valor: 10,
        fechaInicio: new Date(Date.now() - 86400000),
        fechaFin: new Date(Date.now() + 86400000),
        usosMaximos: 50,
        usosActuales: 2,
        montoMinimoCents: null,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCuponRepo.findOne = vi.fn().mockResolvedValue(cuponMock);

      const res = await service.consumirCupon('PROMO10', 10000);
      expect(res.descuentoCents).toBe(1000);
      expect(cuponMock.usosActuales).toBe(3);
      expect(qb.andWhere).toHaveBeenCalledWith(
        '(usos_maximos IS NULL OR usos_actuales < usos_maximos)',
      );
    });

    it('si otro checkout tomó el último uso a la vez, la base no suma y se rechaza', async () => {
      mockCuponRepo.findOne = vi.fn().mockResolvedValue({
        id: 'c1',
        codigo: 'UNO',
        tipoDescuento: TipoDescuentoCupon.PORCENTAJE,
        valor: 10,
        fechaInicio: new Date(Date.now() - 86400000),
        fechaFin: new Date(Date.now() + 86400000),
        usosMaximos: 1,
        usosActuales: 0,
        montoMinimoCents: null,
        activo: true,
      } as Cupon);
      filasAfectadas = 0;
      await expect(service.consumirCupon('UNO', 10000)).rejects.toThrow(/agotado/);
    });
  });

  describe('liberarCupon', () => {
    it('devuelve un uso del cupon con piso en 0, en un UPDATE atómico', async () => {
      await service.liberarCupon('c1');
      expect(qb.set).toHaveBeenCalledWith({ usosActuales: expect.any(Function) });
      expect((qb.set.mock.calls[0][0] as { usosActuales: () => string }).usosActuales()).toBe(
        'GREATEST(0, usos_actuales - 1)',
      );
      expect(qb.where).toHaveBeenCalledWith('id = :id', { id: 'c1' });
    });

    it('un cupon inexistente no rompe: cancelar una venta no puede fallar por esto', async () => {
      filasAfectadas = 0;
      await expect(service.liberarCupon('no-existe')).resolves.toBeUndefined();
    });
  });
});
