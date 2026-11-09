import { describe, expect, it, vi } from 'vitest';
import { TENANT_PRUEBA } from '../../../../vitest.setup.js';
import { ProductosService } from './productos.service.js';

// H1: el espejo offline del móvil baja el catálogo con variantes en UNA consulta.
describe('ProductosService.findAll(conVariantes)', () => {
  const crear = () => {
    const qb = {
      innerJoinAndSelect: vi.fn().mockReturnThis(),
      leftJoinAndMapMany: vi.fn().mockReturnThis(),
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      addOrderBy: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue([
        {
          id: 'p1', categoria: { id: 'cat' }, coleccion: { id: 'col' }, titulo: 'Vestido', slug: 'vestido',
          descripcion: null, precioCents: 25000, imagenes: [], activo: true,
          variantes: [{ id: 'v1', sku: 'VES-M-ROJ', activo: true, talla: { id: 't', nombre: 'M' }, color: { id: 'c', nombre: 'Rojo', hexCode: '#FF0000' } }],
        },
        { id: 'p2', categoria: { id: 'cat' }, coleccion: { id: 'col' }, titulo: 'Blusa', slug: 'blusa', descripcion: null, precioCents: 1, imagenes: [], activo: true, variantes: [] },
      ]),
    };
    const productoRepo = { createQueryBuilder: vi.fn(() => qb), find: vi.fn() };
    const varianteRepo = { find: vi.fn() };
    const service = new ProductosService(
      productoRepo as never, {} as never, {} as never, varianteRepo as never, {} as never, {} as never,
    );
    return { service, qb, productoRepo, varianteRepo };
  };

  it('una sola consulta con LEFT JOIN de variantes, talla y color, filtrada por tenant', async () => {
    const { service, qb, productoRepo, varianteRepo } = crear();
    const r = await service.findAll(true);
    expect(qb.getMany).toHaveBeenCalledTimes(1);
    expect(varianteRepo.find).not.toHaveBeenCalled(); // sin N+1
    expect(productoRepo.find).not.toHaveBeenCalled();
    expect(qb.where).toHaveBeenCalledWith(expect.stringContaining('p.tenant_id = :tenantId'), { tenantId: TENANT_PRUEBA });
    expect(r[0].variantes).toEqual([
      { id: 'v1', tallaId: 't', tallaNombre: 'M', colorId: 'c', colorNombre: 'Rojo', colorHex: '#FF0000', sku: 'VES-M-ROJ', activo: true },
    ]);
    expect(r[1].variantes).toEqual([]); // producto sin variantes igual aparece
  });

  it('sin el parámetro sigue como antes (sin variantes)', async () => {
    const { service, productoRepo, qb } = crear();
    productoRepo.find.mockResolvedValue([]);
    await service.findAll();
    expect(productoRepo.find).toHaveBeenCalledTimes(1);
    expect(qb.getMany).not.toHaveBeenCalled();
  });
});
