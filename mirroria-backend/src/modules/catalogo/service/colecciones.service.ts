import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecursoNoEncontradoException } from '../../../core/exception/recurso-no-encontrado.exception.js';
import { ProveedoresService } from '../../proveedores/service/proveedores.service.js';
import type { ColeccionResponseDto } from '../dto/catalogo-response.dto.js';
import type { CreateColeccionDto } from '../dto/create-coleccion.dto.js';
import { Coleccion } from '../entities/coleccion.entity.js';
import { Temporada } from '../entities/temporada.entity.js';

@Injectable()
export class ColeccionesService {
  constructor(
    @InjectRepository(Coleccion)
    private readonly coleccionRepository: Repository<Coleccion>,
    @InjectRepository(Temporada)
    private readonly temporadaRepository: Repository<Temporada>,
    // Dependencia a nivel de servicio (no de entidad/repositorio) del módulo
    // proveedores — así se valida que proveedorId exista sin que catalogo
    // importe la entidad Proveedor ni su repositorio directamente.
    private readonly proveedoresService: ProveedoresService,
  ) {}

  async create(dto: CreateColeccionDto): Promise<ColeccionResponseDto> {
    const temporada = await this.temporadaRepository.findOne({
      where: { id: dto.temporadaId },
    });
    if (!temporada) {
      throw new RecursoNoEncontradoException('Temporada', dto.temporadaId);
    }

    // Lanza RecursoNoEncontradoException si el proveedor no existe.
    await this.proveedoresService.findOne(dto.proveedorId);

    const coleccion = await this.coleccionRepository.save(
      this.coleccionRepository.create({
        nombre: dto.nombre,
        descripcion: dto.descripcion ?? null,
        temporada,
        proveedorId: dto.proveedorId,
        activo: true,
      }),
    );
    return this.toResponse(coleccion);
  }

  async findAll(): Promise<ColeccionResponseDto[]> {
    const colecciones = await this.coleccionRepository.find({
      where: { activo: true },
      relations: { temporada: true },
      order: { nombre: 'ASC' },
    });
    return colecciones.map((c) => this.toResponse(c));
  }

  private toResponse(coleccion: Coleccion): ColeccionResponseDto {
    return {
      id: coleccion.id,
      nombre: coleccion.nombre,
      descripcion: coleccion.descripcion,
      temporadaId: coleccion.temporada.id,
      proveedorId: coleccion.proveedorId,
      activo: coleccion.activo,
    };
  }
}
