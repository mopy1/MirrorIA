import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecursoDuplicadoException } from '../../../core/exception/recurso-duplicado.exception.js';
import type { TallaResponseDto } from '../dto/catalogo-response.dto.js';
import type { CreateTallaDto } from '../dto/create-talla.dto.js';
import { Talla } from '../entities/talla.entity.js';

@Injectable()
export class TallasService {
  constructor(
    @InjectRepository(Talla)
    private readonly tallaRepository: Repository<Talla>,
  ) {}

  async create(dto: CreateTallaDto): Promise<TallaResponseDto> {
    const existente = await this.tallaRepository.findOne({
      where: { nombre: dto.nombre },
    });
    if (existente) {
      throw new RecursoDuplicadoException(
        `Ya existe una talla "${dto.nombre}"`,
      );
    }

    const talla = await this.tallaRepository.save(
      this.tallaRepository.create({
        nombre: dto.nombre,
        orden: dto.orden ?? 0,
      }),
    );
    return this.toResponse(talla);
  }

  async findAll(): Promise<TallaResponseDto[]> {
    const tallas = await this.tallaRepository.find({ order: { orden: 'ASC' } });
    return tallas.map((t) => this.toResponse(t));
  }

  private toResponse(talla: Talla): TallaResponseDto {
    return { id: talla.id, nombre: talla.nombre, orden: talla.orden };
  }
}
