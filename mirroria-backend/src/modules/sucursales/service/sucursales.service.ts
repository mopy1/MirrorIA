import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecursoNoEncontradoException } from '../../../core/exception/recurso-no-encontrado.exception.js';
import type { CreateSucursalDto } from '../dto/create-sucursal.dto.js';
import type { SucursalResponseDto } from '../dto/sucursales-response.dto.js';
import { Sucursal } from '../entities/sucursal.entity.js';
import { CiudadesService } from './ciudades.service.js';

@Injectable()
export class SucursalesService {
  constructor(
    @InjectRepository(Sucursal)
    private readonly sucursalRepository: Repository<Sucursal>,
    private readonly ciudadesService: CiudadesService,
  ) {}

  async create(dto: CreateSucursalDto): Promise<SucursalResponseDto> {
    const ciudad = await this.ciudadesService.findOne(dto.ciudadId);

    const sucursal = await this.sucursalRepository.save(
      this.sucursalRepository.create({
        ciudad,
        nombre: dto.nombre,
        direccion: dto.direccion,
        telefono: dto.telefono ?? null,
        activo: true,
      }),
    );
    return this.toResponse(sucursal);
  }

  async findAll(): Promise<SucursalResponseDto[]> {
    const sucursales = await this.sucursalRepository.find({
      where: { activo: true },
      relations: { ciudad: true },
      order: { nombre: 'ASC' },
    });
    return sucursales.map((s) => this.toResponse(s));
  }

  async findOne(id: string): Promise<Sucursal> {
    const sucursal = await this.sucursalRepository.findOne({
      where: { id },
      relations: { ciudad: true },
    });
    if (!sucursal) {
      throw new RecursoNoEncontradoException('Sucursal', id);
    }
    return sucursal;
  }

  async findOneResponse(id: string): Promise<SucursalResponseDto> {
    return this.toResponse(await this.findOne(id));
  }

  /**
   * Usado por otros módulos (inventario, ventas) solo para validar que un
   * sucursalId exista antes de operar — mismo criterio que
   * ProveedoresService.findOne consumido desde catalogo.
   */
  async assertExists(id: string): Promise<void> {
    await this.findOne(id);
  }

  private toResponse(sucursal: Sucursal): SucursalResponseDto {
    return {
      id: sucursal.id,
      ciudadId: sucursal.ciudad.id,
      ciudadNombre: sucursal.ciudad.nombre,
      nombre: sucursal.nombre,
      direccion: sucursal.direccion,
      telefono: sucursal.telefono,
      activo: sucursal.activo,
    };
  }
}
