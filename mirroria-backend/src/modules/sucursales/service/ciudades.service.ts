import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecursoNoEncontradoException } from '../../../core/exception/recurso-no-encontrado.exception.js';
import type { CreateCiudadDto } from '../dto/create-ciudad.dto.js';
import type { CiudadResponseDto } from '../dto/sucursales-response.dto.js';
import { Ciudad } from '../entities/ciudad.entity.js';

@Injectable()
export class CiudadesService {
  constructor(
    @InjectRepository(Ciudad)
    private readonly ciudadRepository: Repository<Ciudad>,
  ) {}

  async create(dto: CreateCiudadDto): Promise<CiudadResponseDto> {
    const ciudad = await this.ciudadRepository.save(
      this.ciudadRepository.create({ nombre: dto.nombre, pais: dto.pais }),
    );
    return this.toResponse(ciudad);
  }

  async findAll(): Promise<CiudadResponseDto[]> {
    const ciudades = await this.ciudadRepository.find({
      order: { nombre: 'ASC' },
    });
    return ciudades.map((c) => this.toResponse(c));
  }

  async findOne(id: string): Promise<Ciudad> {
    const ciudad = await this.ciudadRepository.findOne({ where: { id } });
    if (!ciudad) {
      throw new RecursoNoEncontradoException('Ciudad', id);
    }
    return ciudad;
  }

  private toResponse(ciudad: Ciudad): CiudadResponseDto {
    return { id: ciudad.id, nombre: ciudad.nombre, pais: ciudad.pais };
  }
}
