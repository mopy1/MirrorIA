import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EntityManager } from 'typeorm';
import { Repository } from 'typeorm';
import { OperacionInvalidaException } from '../../../core/exception/operacion-invalida.exception.js';
import { ProductosService } from '../../catalogo/service/productos.service.js';
import { REGLAS_COMPRA } from '../reglas-compra.js';
import type { AddItemCarritoDto } from '../dto/add-item-carrito.dto.js';
import type { CarritoResponseDto } from '../dto/ventas-response.dto.js';
import { Carrito, type CarritoItem } from '../entities/carrito.entity.js';

/**
 * Suma `devueltos` a los ítems del carrito sin pasar el tope por variante
 * (lo que sobra se descarta: el carrito nunca acepta más de eso).
 */
export function sumarAlCarrito(
  actuales: CarritoItem[],
  devueltos: CarritoItem[],
  tope: number = REGLAS_COMPRA.maxUnidadesPorVariante,
): CarritoItem[] {
  const items = actuales.map((i) => ({ ...i }));
  for (const { varianteId, cantidad } of devueltos) {
    const existente = items.find((i) => i.varianteId === varianteId);
    if (existente) {
      existente.cantidad = Math.min(tope, existente.cantidad + cantidad);
    } else {
      items.push({ varianteId, cantidad: Math.min(tope, cantidad) });
    }
  }
  return items;
}

@Injectable()
export class CarritosService {
  constructor(
    @InjectRepository(Carrito)
    private readonly carritoRepository: Repository<Carrito>,
    private readonly productosService: ProductosService,
  ) {}

  async findOrCreateActivo(usuarioId: string, manager?: EntityManager): Promise<Carrito> {
    const repo = manager ? manager.getRepository(Carrito) : this.carritoRepository;
    // INSERT ... ON CONFLICT DO NOTHING: dos pedidos simultáneos de una clienta
    // sin carrito chocaban contra el unique de usuario_id y uno daba 500.
    const buscar = () =>
      repo.findOne({
        where: { usuarioId },
        ...(manager ? { lock: { mode: 'pessimistic_write' as const } } : {}),
      });
    const carrito = await buscar();
    if (carrito) return carrito;
    await repo.createQueryBuilder().insert().values({ usuarioId, items: [] }).orIgnore().execute();
    return (await buscar())!;
  }

  async getCarrito(usuarioId: string): Promise<CarritoResponseDto> {
    return this.toResponse(await this.findOrCreateActivo(usuarioId));
  }

  async addItem(usuarioId: string, dto: AddItemCarritoDto): Promise<CarritoResponseDto> {
    // Valida que la variante exista y siga a la venta antes de meterla al jsonb.
    const variante = await this.productosService.findVarianteById(dto.varianteId);
    if (!variante.activo || !variante.producto?.activo) {
      throw new OperacionInvalidaException('Esta prenda ya no está disponible');
    }

    // Carrito bloqueado (FOR UPDATE): dos "agregar" simultáneos leían el mismo
    // jsonb y el segundo save borraba el ítem del primero.
    return this.carritoRepository.manager.transaction(async (manager) => {
      const carrito = await this.findOrCreateActivo(usuarioId, manager);
      const existente = carrito.items.find((i) => i.varianteId === dto.varianteId);
      const total = (existente?.cantidad ?? 0) + dto.cantidad;
      if (total > REGLAS_COMPRA.maxUnidadesPorVariante) {
        throw new OperacionInvalidaException(
          `Podés llevar hasta ${REGLAS_COMPRA.maxUnidadesPorVariante} unidades de la misma talla y color`,
        );
      }
      if (existente) {
        existente.cantidad += dto.cantidad;
      } else {
        carrito.items.push({ varianteId: dto.varianteId, cantidad: dto.cantidad });
      }
      const guardado = await manager.getRepository(Carrito).save(carrito);
      return this.toResponse(guardado);
    });
  }

  async removeItem(usuarioId: string, varianteId: string): Promise<CarritoResponseDto> {
    return this.carritoRepository.manager.transaction(async (manager) => {
      const carrito = await this.findOrCreateActivo(usuarioId, manager);
      carrito.items = carrito.items.filter((i) => i.varianteId !== varianteId);
      const guardado = await manager.getRepository(Carrito).save(carrito);
      return this.toResponse(guardado);
    });
  }

  /** Usado por VentasService al completar el checkout. */
  async vaciar(usuarioId: string, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(Carrito) : this.carritoRepository;
    await repo.delete({ usuarioId });
  }

  /**
   * Devuelve al carrito las prendas de una compra que no se pagó (la clienta
   * volvió al carrito o la compra venció): sin esto desaparecían, porque el
   * checkout vacía el carrito. Corre dentro de la transacción de la
   * cancelación. Se saltean las variantes o productos dados de baja: no se
   * pueden volver a comprar. El stock no se valida, igual que al agregar.
   */
  async devolverItems(
    usuarioId: string,
    items: CarritoItem[],
    manager: EntityManager,
  ): Promise<void> {
    const vigentes: CarritoItem[] = [];
    for (const item of items) {
      const variante = await this.productosService
        .findVarianteById(item.varianteId)
        .catch(() => null);
      if (variante?.activo && variante.producto?.activo) {
        vigentes.push({ varianteId: item.varianteId, cantidad: item.cantidad });
      }
    }
    if (vigentes.length === 0) return;

    const repo = manager.getRepository(Carrito);
    const carrito =
      (await repo.findOne({ where: { usuarioId }, lock: { mode: 'pessimistic_write' } })) ??
      repo.create({ usuarioId, items: [] });
    carrito.items = sumarAlCarrito(carrito.items, vigentes);
    await repo.save(carrito);
  }

  private toResponse(carrito: Carrito): CarritoResponseDto {
    return { id: carrito.id, usuarioId: carrito.usuarioId, items: carrito.items };
  }
}
