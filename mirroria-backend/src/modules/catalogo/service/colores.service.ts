import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecursoDuplicadoException } from '../../../core/exception/recurso-duplicado.exception.js';
import type { ColorResponseDto } from '../dto/catalogo-response.dto.js';
import type { CreateColorDto } from '../dto/create-color.dto.js';
import { Color } from '../entities/color.entity.js';

@Injectable()
export class ColoresService {
  constructor(
    @InjectRepository(Color)
    private readonly colorRepository: Repository<Color>,
  ) {}

  async create(dto: CreateColorDto): Promise<ColorResponseDto> {
    const existente = await this.colorRepository.findOne({
      where: { nombre: dto.nombre },
    });
    if (existente) {
      throw new RecursoDuplicadoException(
        `Ya existe un color "${dto.nombre}"`,
      );
    }

    const color = await this.colorRepository.save(
      this.colorRepository.create({
        nombre: dto.nombre,
        hexCode: dto.hexCode ?? null,
      }),
    );
    return this.toResponse(color);
  }

  async findAll(): Promise<ColorResponseDto[]> {
    const colores = await this.colorRepository.find({ order: { nombre: 'ASC' } });
    return colores.map((c) => this.toResponse(c));
  }

  private toResponse(color: Color): ColorResponseDto {
    return { id: color.id, nombre: color.nombre, hexCode: color.hexCode };
  }
}
