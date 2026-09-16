import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EntityManager } from 'typeorm';
import { Repository } from 'typeorm';
import { ProductosService } from '../../catalogo/service/productos.service.js';
import type { AddItemCarritoDto } from '../dto/add-item-carrito.dto.js';
import type { CarritoResponseDto } from '../dto/ventas-response.dto.js';
import { Carrito } from '../entities/carrito.entity.js';

@Injectable()
export class CarritosService {
  constructor(
    @InjectRepository(Carrito)
    private readonly carritoRepository: Repository<Carrito>,
    private readonly productosService: ProductosService,
  ) {}

  async findOrCreateActivo(usuarioId: string): Promise<Carrito> {
    let carrito = await this.carritoRepository.findOne({ where: { usuarioId } });
    if (!carrito) {
      carrito = await this.carritoRepository.save(
        this.carritoRepository.create({ usuarioId, items: [] }),
      );
    }
    return carrito;
  }

  async getCarrito(usuarioId: string): Promise<CarritoResponseDto> {
    return this.toResponse(await this.findOrCreateActivo(usuarioId));
  }

  async addItem(usuarioId: string, dto: AddItemCarritoDto): Promise<CarritoResponseDto> {
    // Valida que la variante exista antes de meterla al jsonb.
    await this.productosService.findVarianteById(dto.varianteId);

    const carrito = await this.findOrCreateActivo(usuarioId);
    const existente = carrito.items.find((i) => i.varianteId === dto.varianteId);
    if (existente) {
      existente.cantidad += dto.cantidad;
    } else {
      carrito.items.push({ varianteId: dto.varianteId, cantidad: dto.cantidad });
    }
    const guardado = await this.carritoRepository.save(carrito);
    return this.toResponse(guardado);
  }

  async removeItem(usuarioId: string, varianteId: string): Promise<CarritoResponseDto> {
    const carrito = await this.findOrCreateActivo(usuarioId);
    carrito.items = carrito.items.filter((i) => i.varianteId !== varianteId);
    const guardado = await this.carritoRepository.save(carrito);
    return this.toResponse(guardado);
  }

  /** Usado por VentasService al completar el checkout. */
  async vaciar(usuarioId: string, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(Carrito) : this.carritoRepository;
    await repo.delete({ usuarioId });
  }

  private toResponse(carrito: Carrito): CarritoResponseDto {
    return { id: carrito.id, usuarioId: carrito.usuarioId, items: carrito.items };
  }
}
