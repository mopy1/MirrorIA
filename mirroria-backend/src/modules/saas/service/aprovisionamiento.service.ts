import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { type DataSource, QueryFailedError } from 'typeorm';
import { conTenant } from '../../../core/tenancy/tenant-context.js';
import { CatalogoBaseService } from '../../catalogo/service/catalogo-base.service.js';
import { ProveedoresService } from '../../proveedores/service/proveedores.service.js';
import { AuthService } from '../../seguridad/service/auth.service.js';
import { UsuariosService } from '../../seguridad/service/usuarios.service.js';
import { SucursalesService } from '../../sucursales/service/sucursales.service.js';
import type { RegistrarTiendaDto } from '../dto/registrar-tienda.dto.js';
import type { RegistroTiendaResponse } from '../dto/registro-tienda-response.dto.js';
import { EstadoInquilino, Inquilino } from '../entities/inquilino.entity.js';
import { SlugNoDisponibleException } from '../exception/slug-no-disponible.exception.js';
import { SLUGS_RESERVADOS } from '../saas-reglas.js';
import { tiendaADto } from './inquilinos.service.js';
import { PlanesService } from './planes.service.js';
import { suscripcionADto, SuscripcionesService } from './suscripciones.service.js';

/**
 * Alta de una tienda (CU: "registrar mi tienda"). TODO en una transacción:
 * inquilino + suscripción TRIAL + ADMIN + sucursal + datos base. Si un paso falla
 * no queda nada. Devuelve el JWT del ADMIN ya logueado.
 */
@Injectable()
export class AprovisionamientoService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly planes: PlanesService,
    private readonly suscripciones: SuscripcionesService,
    private readonly usuarios: UsuariosService,
    private readonly auth: AuthService,
    private readonly sucursales: SucursalesService,
    private readonly proveedores: ProveedoresService,
    private readonly catalogoBase: CatalogoBaseService,
  ) {}

  async registrar(dto: RegistrarTiendaDto): Promise<RegistroTiendaResponse> {
    const slug = dto.tienda.slug.trim().toLowerCase();
    if (SLUGS_RESERVADOS.includes(slug)) throw new SlugNoDisponibleException(slug, 'reservada');
    const plan = await this.planes.porCodigo(dto.planCodigo, true);

    // El id se genera acá para abrir el contexto de la tienda antes del primer insert.
    const tenantId = randomUUID();
    const ctx = {
      tenantId,
      slug,
      nombre: dto.tienda.nombre,
      planNombre: plan.nombre,
      limites: {
        maxSucursales: plan.maxSucursales,
        maxProductos: plan.maxProductos,
        maxUsuariosStaff: plan.maxUsuariosStaff,
      },
    };
    return conTenant(ctx, async () => {
      const creado = await this.dataSource
        .transaction(async (manager) => {
          const inquilinoRepo = manager.getRepository(Inquilino);
          const inquilino = await inquilinoRepo.save(
            inquilinoRepo.create({
              id: tenantId,
              nombre: dto.tienda.nombre,
              slug,
              estado: EstadoInquilino.ACTIVO,
              motivoSuspension: null,
              propietarioId: null,
            }),
          );
          const suscripcion = await this.suscripciones.crearTrial(manager, inquilino, plan);
          const admin = await this.usuarios.crearAdminInicial(dto.admin, manager);
          const sucursal = await this.sucursales.crearInicial(dto.sucursal, manager);
          const proveedor = await this.proveedores.crearPropio(manager);
          await this.catalogoBase.sembrarBase(manager, { proveedorId: proveedor.id });
          inquilino.propietarioId = admin.id;
          await inquilinoRepo.save(inquilino);
          return { inquilino, suscripcion, admin, sucursal };
        })
        .catch((err: unknown) => {
          // Otra tienda tomó el slug un instante antes (único de inquilinos.slug).
          if (err instanceof QueryFailedError && (err.driverError as { code?: string })?.code === '23505') {
            throw new SlugNoDisponibleException(slug, 'ocupada');
          }
          throw err;
        });

      return {
        ...this.auth.emitirToken(creado.admin),
        tienda: tiendaADto(creado.inquilino, creado.suscripcion),
        suscripcion: suscripcionADto(creado.suscripcion),
        sucursalId: creado.sucursal.id,
      };
    });
  }
}
