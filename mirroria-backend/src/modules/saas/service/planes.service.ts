import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { RecursoDuplicadoException } from '../../../core/exception/recurso-duplicado.exception.js';
import { RecursoNoEncontradoException } from '../../../core/exception/recurso-no-encontrado.exception.js';
import type { ActualizarPlanDto, CrearPlanDto } from '../dto/crear-plan.dto.js';
import type { PlanDto } from '../dto/plan.dto.js';
import { Plan } from '../entities/plan.entity.js';
import { ResolverTenantService } from './resolver-tenant.service.js';

export function planADto(plan: Plan): PlanDto {
  return {
    id: plan.id,
    codigo: plan.codigo,
    nombre: plan.nombre,
    descripcion: plan.descripcion,
    precioMensualCents: plan.precioMensualCents,
    precioMensualUsdCents: plan.precioMensualUsdCents,
    diasPrueba: plan.diasPrueba,
    orden: plan.orden,
    activo: plan.activo,
    limites: {
      maxSucursales: plan.maxSucursales,
      maxProductos: plan.maxProductos,
      maxUsuariosStaff: plan.maxUsuariosStaff,
    },
    nivelMarca: plan.nivelMarca,
    destacado: plan.destacado,
  };
}

/** Catálogo de planes (tabla global de la plataforma). */
@Injectable()
export class PlanesService {
  constructor(
    @InjectRepository(Plan) private readonly planRepository: Repository<Plan>,
    private readonly resolver: ResolverTenantService,
  ) {}

  async listar(soloActivos: boolean): Promise<PlanDto[]> {
    const planes = await this.planRepository.find({
      where: soloActivos ? { activo: true } : {},
      order: { orden: 'ASC', precioMensualCents: 'ASC' },
    });
    return planes.map(planADto);
  }

  /** 404 si no existe (o si está inactivo y se pide uno ofrecible). */
  async porCodigo(codigo: string, exigirActivo: boolean): Promise<Plan> {
    const plan = await this.planRepository.findOne({ where: { codigo: codigo.trim().toLowerCase() } });
    if (!plan || (exigirActivo && !plan.activo)) {
      throw new RecursoNoEncontradoException('Plan', codigo);
    }
    return plan;
  }

  async crear(dto: CrearPlanDto): Promise<PlanDto> {
    if (await this.planRepository.exists({ where: { codigo: dto.codigo } })) {
      throw new RecursoDuplicadoException(`Ya existe un plan con el código "${dto.codigo}"`);
    }
    const plan = await this.planRepository.save(
      this.planRepository.create({
        codigo: dto.codigo,
        nombre: dto.nombre,
        descripcion: dto.descripcion ?? null,
        precioMensualCents: dto.precioMensualCents,
        precioMensualUsdCents: dto.precioMensualUsdCents,
        diasPrueba: dto.diasPrueba ?? 14,
        orden: dto.orden ?? 0,
        activo: true,
        maxSucursales: dto.limites.maxSucursales ?? null,
        maxProductos: dto.limites.maxProductos ?? null,
        maxUsuariosStaff: dto.limites.maxUsuariosStaff ?? null,
        nivelMarca: dto.nivelMarca ?? 'ESENCIAL',
        destacado: dto.destacado ?? false,
      }),
    );
    if (plan.destacado) await this.apagarOtrosDestacados(plan.id);
    this.resolver.invalidar();
    return planADto(plan);
  }

  /** En `limites`, un campo ausente no cambia y `null` lo deja ilimitado. */
  async actualizar(id: string, dto: ActualizarPlanDto): Promise<PlanDto> {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) throw new RecursoNoEncontradoException('Plan', id);
    if (dto.nombre !== undefined) plan.nombre = dto.nombre;
    if (dto.descripcion !== undefined) plan.descripcion = dto.descripcion;
    if (dto.precioMensualCents !== undefined) plan.precioMensualCents = dto.precioMensualCents;
    if (dto.precioMensualUsdCents !== undefined) plan.precioMensualUsdCents = dto.precioMensualUsdCents;
    if (dto.diasPrueba !== undefined) plan.diasPrueba = dto.diasPrueba;
    if (dto.orden !== undefined) plan.orden = dto.orden;
    if (dto.activo !== undefined) plan.activo = dto.activo;
    if (dto.nivelMarca !== undefined) plan.nivelMarca = dto.nivelMarca;
    if (dto.destacado !== undefined) plan.destacado = dto.destacado;
    const l = dto.limites;
    if (l?.maxSucursales !== undefined) plan.maxSucursales = l.maxSucursales;
    if (l?.maxProductos !== undefined) plan.maxProductos = l.maxProductos;
    if (l?.maxUsuariosStaff !== undefined) plan.maxUsuariosStaff = l.maxUsuariosStaff;
    const guardado = await this.planRepository.save(plan);
    if (guardado.destacado) await this.apagarOtrosDestacados(guardado.id);
    this.resolver.invalidar(); // los límites y el nivel de marca viajan en la caché de cada tienda
    return planADto(guardado);
  }

  /** A lo sumo un plan destacado. */
  private async apagarOtrosDestacados(id: string): Promise<void> {
    await this.planRepository.update({ destacado: true, id: Not(id) }, { destacado: false });
  }
}
