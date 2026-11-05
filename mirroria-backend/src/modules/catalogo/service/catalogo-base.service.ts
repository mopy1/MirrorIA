import { Injectable } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import { Categoria } from '../entities/categoria.entity.js';
import { Coleccion } from '../entities/coleccion.entity.js';
import { Color } from '../entities/color.entity.js';
import { Talla } from '../entities/talla.entity.js';
import { Temporada } from '../entities/temporada.entity.js';

export const TALLAS_BASE = ['XS', 'S', 'M', 'L', 'XL'];
export const COLORES_BASE: Array<[string, string]> = [
  ['Negro', '#111111'], ['Blanco', '#FAFAFA'], ['Rojo', '#C1121F'],
  ['Azul marino', '#1E3A8A'], ['Beige', '#D6C6A8'], ['Rosa', '#E8A0BF'],
];
/** Catálogo solo femenino, sin género (regla del proyecto). */
export const CATEGORIAS_BASE: Array<[string, string]> = [
  ['Vestidos', 'vestidos'], ['Blusas', 'blusas'], ['Pantalones', 'pantalones'],
  ['Faldas', 'faldas'], ['Accesorios', 'accesorios'],
];

const fechaISO = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Datos base de una tienda nueva, para que su dueña cargue la primera prenda sin
 * pasar antes por 3 pantallas (productos.coleccion_id y colecciones.proveedor_id
 * son NOT NULL). Corre dentro de la transacción y el conTenant del aprovisionamiento:
 * el tenant_id lo completa TenantSubscriber.
 */
@Injectable()
export class CatalogoBaseService {
  async sembrarBase(manager: EntityManager, datos: { proveedorId: string }): Promise<void> {
    await manager.getRepository(Talla).save(
      TALLAS_BASE.map((nombre, i) => manager.getRepository(Talla).create({ nombre, orden: i + 1 })),
    );
    await manager.getRepository(Color).save(
      COLORES_BASE.map(([nombre, hexCode]) => manager.getRepository(Color).create({ nombre, hexCode })),
    );
    await manager.getRepository(Categoria).save(
      CATEGORIAS_BASE.map(([nombre, slug]) =>
        manager.getRepository(Categoria).create({ nombre, slug, padre: null, activo: true }),
      ),
    );

    const hoy = new Date();
    const enSeisMeses = new Date(hoy);
    enSeisMeses.setMonth(enSeisMeses.getMonth() + 6);
    const temporadaRepo = manager.getRepository(Temporada);
    const temporada = await temporadaRepo.save(
      temporadaRepo.create({
        nombre: `Temporada ${hoy.getFullYear()}`,
        fechaInicio: fechaISO(hoy),
        fechaFin: fechaISO(enSeisMeses),
        activo: true,
      }),
    );

    const coleccionRepo = manager.getRepository(Coleccion);
    await coleccionRepo.save(
      coleccionRepo.create({
        nombre: 'Colección inicial',
        descripcion: null,
        temporada,
        proveedorId: datos.proveedorId,
        activo: true,
      }),
    );
  }
}
