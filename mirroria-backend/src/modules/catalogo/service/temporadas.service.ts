import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { TemporadaResponseDto } from '../dto/catalogo-response.dto.js';
import type { CreateTemporadaDto } from '../dto/create-temporada.dto.js';
import { Temporada } from '../entities/temporada.entity.js';

@Injectable()
export class TemporadasService {
  constructor(
    @InjectRepository(Temporada)
    private readonly temporadaRepository: Repository<Temporada>,
  ) {}

  async create(dto: CreateTemporadaDto): Promise<TemporadaResponseDto> {
    const temporada = await this.temporadaRepository.save(
      this.temporadaRepository.create({
        nombre: dto.nombre,
        fechaInicio: dto.fechaInicio,
        fechaFin: dto.fechaFin,
        activo: true,
      }),
    );
    return this.toResponse(temporada);
  }

  async findAll(): Promise<TemporadaResponseDto[]> {
    const temporadas = await this.temporadaRepository.find({
      where: { activo: true },
      order: { fechaInicio: 'DESC' },
    });
    return temporadas.map((t) => this.toResponse(t));
  }

  private toResponse(temporada: Temporada): TemporadaResponseDto {
    return {
      id: temporada.id,
      nombre: temporada.nombre,
      fechaInicio: temporada.fechaInicio,
      fechaFin: temporada.fechaFin,
      activo: temporada.activo,
    };
  }
}
