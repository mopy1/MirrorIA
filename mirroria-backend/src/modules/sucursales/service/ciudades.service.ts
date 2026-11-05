import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecursoDuplicadoException } from '../../../core/exception/recurso-duplicado.exception.js';
import { RecursoNoEncontradoException } from '../../../core/exception/recurso-no-encontrado.exception.js';
import type { CreateCiudadDto } from '../dto/create-ciudad.dto.js';
import type { CiudadResponseDto } from '../dto/sucursales-response.dto.js';
import { Ciudad } from '../entities/ciudad.entity.js';

/** Las 9 capitales de departamento: toda tienda nueva elige su sucursal entre estas. */
export const CIUDADES_BASE = [
  'Sucre', 'La Paz', 'Cochabamba', 'Oruro', 'Potosí', 'Tarija', 'Santa Cruz', 'Trinidad', 'Cobija',
];

/** Ciudades GLOBALES (sin tenant): geografía compartida, solo la plataforma agrega. */
@Injectable()
export class CiudadesService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CiudadesService.name);

  constructor(
    @InjectRepository(Ciudad)
    private readonly ciudadRepository: Repository<Ciudad>,
  ) {}

  /** Upsert idempotente por (nombre, pais). */
  async onApplicationBootstrap(): Promise<void> {
    const { identifiers } = await this.ciudadRepository
      .createQueryBuilder()
      .insert()
      .values(CIUDADES_BASE.map((nombre) => ({ nombre, pais: 'Bolivia' })))
      .orIgnore()
      .execute();
    const nuevas = identifiers.filter(Boolean).length;
    if (nuevas > 0) this.logger.log(`Ciudades base sembradas: ${nuevas}`);
  }

  async create(dto: CreateCiudadDto): Promise<CiudadResponseDto> {
    const nombre = dto.nombre.trim();
    const pais = dto.pais.trim();
    const existente = await this.ciudadRepository.findOne({ where: { nombre, pais } }); // sin-tenant: ciudades globales
    if (existente) {
      throw new RecursoDuplicadoException(`Ya existe la ciudad "${nombre}" en ${pais}`);
    }
    const ciudad = await this.ciudadRepository.save(this.ciudadRepository.create({ nombre, pais }));
    return this.toResponse(ciudad);
  }

  async findAll(): Promise<CiudadResponseDto[]> {
    const ciudades = await this.ciudadRepository.find({
      order: { nombre: 'ASC' },
    });
    return ciudades.map((c) => this.toResponse(c));
  }

  async findOne(id: string): Promise<Ciudad> {
    const ciudad = await this.ciudadRepository.findOne({ where: { id } }); // sin-tenant: ciudades globales
    if (!ciudad) {
      throw new RecursoNoEncontradoException('Ciudad', id);
    }
    return ciudad;
  }

  private toResponse(ciudad: Ciudad): CiudadResponseDto {
    return { id: ciudad.id, nombre: ciudad.nombre, pais: ciudad.pais };
  }
}
