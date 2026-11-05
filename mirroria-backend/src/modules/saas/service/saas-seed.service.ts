import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { conTenant } from '../../../core/tenancy/tenant-context.js';
import { UsuariosService } from '../../seguridad/service/usuarios.service.js';
import { EstadoInquilino, Inquilino } from '../entities/inquilino.entity.js';
import { Plan } from '../entities/plan.entity.js';
import { EstadoSuscripcion, Suscripcion } from '../entities/suscripcion.entity.js';
import { MIRRORIA_TENANT_ID } from '../saas-reglas.js';

type PlanSeed = Pick<
  Plan,
  'codigo' | 'nombre' | 'descripcion' | 'precioMensualCents' | 'precioMensualUsdCents' |
  'maxSucursales' | 'maxProductos' | 'maxUsuariosStaff' | 'diasPrueba' | 'orden'
>;

export const PLANES_BASE: PlanSeed[] = [
  {
    codigo: 'basico', nombre: 'Básico', descripcion: 'Para empezar a vender online con una sola tienda física.',
    precioMensualCents: 9900, precioMensualUsdCents: 1490,
    maxSucursales: 1, maxProductos: 50, maxUsuariosStaff: 3, diasPrueba: 14, orden: 1,
  },
  {
    codigo: 'crecimiento', nombre: 'Crecimiento', descripcion: 'Para boutiques que ya tienen varias sucursales y equipo.',
    precioMensualCents: 24900, precioMensualUsdCents: 3590,
    maxSucursales: 3, maxProductos: 300, maxUsuariosStaff: 10, diasPrueba: 14, orden: 2,
  },
  {
    codigo: 'cadena', nombre: 'Cadena', descripcion: 'Sin límites de sucursales, prendas ni equipo.',
    precioMensualCents: 59900, precioMensualUsdCents: 8590,
    maxSucursales: null, maxProductos: null, maxUsuariosStaff: null, diasPrueba: 14, orden: 3,
  },
];

/**
 * Idempotente, corre en cada arranque (local y Azure): planes, tienda demo
 * MirrorIA (id fijo: ahí quedaron los datos del Parcial 1), su suscripción demo
 * y la cuenta DUENO_PLATAFORMA desde el .env (nunca contraseñas en el código).
 */
@Injectable()
export class SaasSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SaasSeedService.name);

  constructor(
    @InjectRepository(Plan) private readonly planRepo: Repository<Plan>,
    @InjectRepository(Inquilino) private readonly inquilinoRepo: Repository<Inquilino>,
    @InjectRepository(Suscripcion) private readonly suscripcionRepo: Repository<Suscripcion>,
    private readonly usuarios: UsuariosService,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.sembrarPlanes();
    await this.sembrarMirroria();
    await this.sembrarDuenoPlataforma();
  }

  private async sembrarPlanes(): Promise<void> {
    for (const datos of PLANES_BASE) {
      if (!(await this.planRepo.exists({ where: { codigo: datos.codigo } }))) {
        await this.planRepo.save(this.planRepo.create({ ...datos, activo: true }));
        this.logger.log(`Plan sembrado: ${datos.codigo}`);
      }
    }
  }

  private async sembrarMirroria(): Promise<void> {
    let mirroria = await this.inquilinoRepo.findOne({ where: { id: MIRRORIA_TENANT_ID } });
    if (!mirroria) {
      const propietarioId = await conTenant({ tenantId: MIRRORIA_TENANT_ID }, () =>
        this.usuarios.idPorEmail('admin@mirroria.com'),
      );
      mirroria = await this.inquilinoRepo.save(
        this.inquilinoRepo.create({
          id: MIRRORIA_TENANT_ID,
          nombre: 'MirrorIA',
          slug: 'mirroria',
          estado: EstadoInquilino.ACTIVO,
          motivoSuspension: null,
          propietarioId,
        }),
      );
      this.logger.log('Tienda demo "mirroria" creada');
    }
    if (!(await this.suscripcionRepo.exists({ where: { inquilino: { id: MIRRORIA_TENANT_ID } } }))) {
      const cadena = await this.planRepo.findOneOrFail({ where: { codigo: 'cadena' } });
      await this.suscripcionRepo.save(
        this.suscripcionRepo.create({
          inquilino: mirroria,
          plan: cadena,
          estado: EstadoSuscripcion.ACTIVA,
          inicio: new Date(),
          fin: new Date(2027, 11, 31, 23, 59, 59),
          precioCents: 59900,
          proveedorPago: null,
          referenciaPago: 'demo-parcial2',
          canceladaAt: null,
        }),
      );
      this.logger.log('Suscripción demo de "mirroria" creada (Cadena, ACTIVA hasta 2027-12-31)');
    }
  }

  private async sembrarDuenoPlataforma(): Promise<void> {
    const email = this.config.get<string>('PLATAFORMA_EMAIL')?.trim();
    const password = this.config.get<string>('PLATAFORMA_PASSWORD') ?? '';
    if (!email || password.length < 12) {
      this.logger.warn(
        'Sin PLATAFORMA_EMAIL / PLATAFORMA_PASSWORD (≥ 12 caracteres) en el .env: no se crea la cuenta de plataforma',
      );
      return;
    }
    await this.usuarios.asegurarDuenoPlataforma(email, password);
  }
}
