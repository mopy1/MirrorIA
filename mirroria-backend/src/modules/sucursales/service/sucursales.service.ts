import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EntityManager } from 'typeorm';
import { Repository } from 'typeorm';
import { RecursoNoEncontradoException } from '../../../core/exception/recurso-no-encontrado.exception.js';
import { assertDentroDelPlan, bloquearCupoDelPlan } from '../../../core/tenancy/limites-plan.js';
import { soloTenant } from '../../../core/tenancy/tenant-context.js';
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
    const sucursal = await this.sucursalRepository.manager.transaction(async (manager) => {
      await bloquearCupoDelPlan(manager, 'sucursales');
      const repo = manager.getRepository(Sucursal);
      assertDentroDelPlan('sucursales', await repo.count({ where: soloTenant({ activo: true }) }));
      return repo.save(repo.create({
        ciudad,
        nombre: dto.nombre,
        direccion: dto.direccion,
        telefono: dto.telefono ?? null,
        activo: true,
      }));
    });
    return this.toResponse(sucursal);
  }

  /** Primera sucursal de una tienda nueva (aprovisionamiento, dentro de su transacción y conTenant). */
  async crearInicial(dto: CreateSucursalDto, manager: EntityManager): Promise<Sucursal> {
    const ciudad = await this.ciudadesService.findOne(dto.ciudadId);
    const repo = manager.getRepository(Sucursal);
    return repo.save(
      repo.create({
        ciudad,
        nombre: dto.nombre,
        direccion: dto.direccion,
        telefono: dto.telefono ?? null,
        activo: true,
      }),
    );
  }

  async findAll(): Promise<SucursalResponseDto[]> {
    const sucursales = await this.sucursalRepository.find({
      where: soloTenant({ activo: true }),
      relations: { ciudad: true },
      order: { nombre: 'ASC' },
    });
    return sucursales.map((s) => this.toResponse(s));
  }

  async findOne(id: string, manager?: EntityManager): Promise<Sucursal> {
    const repo = manager ? manager.getRepository(Sucursal) : this.sucursalRepository;
    const sucursal = await repo.findOne({
      where: soloTenant({ id }),
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
   * sucursalId exista EN LA TIENDA del contexto antes de operar (una sucursal
   * de otra tienda da 404) — mismo criterio que ProveedoresService.findOne.
   */
  async assertExists(id: string, manager?: EntityManager): Promise<void> {
    await this.findOne(id, manager);
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
