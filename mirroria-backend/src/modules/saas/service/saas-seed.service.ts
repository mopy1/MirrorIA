import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, In, Repository } from 'typeorm';
import { conTenant } from '../../../core/tenancy/tenant-context.js';
import { UsuariosService } from '../../seguridad/service/usuarios.service.js';
import { EstadoInquilino, Inquilino } from '../entities/inquilino.entity.js';
import { MarcaTienda } from '../entities/marca-tienda.entity.js';
import { MARCA_MIRRORIA, marcaInicial } from '../marca/marca-reglas.js';
import { Plan } from '../entities/plan.entity.js';
import { EstadoSuscripcion, Suscripcion } from '../entities/suscripcion.entity.js';
import { MIRRORIA_TENANT_ID } from '../saas-reglas.js';

type PlanSeed = Pick<
  Plan,
  'codigo' | 'nombre' | 'descripcion' | 'precioMensualCents' | 'precioMensualUsdCents' |
  'maxSucursales' | 'maxProductos' | 'maxUsuariosStaff' | 'diasPrueba' | 'orden' | 'nivelMarca' | 'destacado'
>;

export const PLANES_BASE: PlanSeed[] = [
  {
    codigo: 'basico', nombre: 'Básico', descripcion: 'Para empezar a vender online con una sola tienda física.',
    precioMensualCents: 9900, precioMensualUsdCents: 1490,
    maxSucursales: 1, maxProductos: 50, maxUsuariosStaff: 3, diasPrueba: 14, orden: 1,
    nivelMarca: 'ESENCIAL', destacado: false,
  },
  {
    codigo: 'crecimiento', nombre: 'Crecimiento', descripcion: 'Para boutiques que ya tienen varias sucursales y equipo.',
    precioMensualCents: 24900, precioMensualUsdCents: 3590,
    maxSucursales: 3, maxProductos: 300, maxUsuariosStaff: 10, diasPrueba: 14, orden: 2,
    nivelMarca: 'COMPLETA', destacado: true,
  },
  {
    codigo: 'cadena', nombre: 'Cadena', descripcion: 'Sin límites de sucursales, prendas ni equipo.',
    precioMensualCents: 59900, precioMensualUsdCents: 8590,
    maxSucursales: null, maxProductos: null, maxUsuariosStaff: null, diasPrueba: 14, orden: 3,
    nivelMarca: 'MARCA_BLANCA', destacado: false,
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
    @InjectRepository(MarcaTienda) private readonly marcaRepo: Repository<MarcaTienda>,
    private readonly usuarios: UsuariosService,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.sembrarPlanes();
    await this.nivelesDeMarca();
    await this.sembrarMirroria();
    await this.asegurarMarcas();
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

  /**
   * Fase 1b: las columnas nivel_marca/destacado nacen con su default (ESENCIAL/false) en
   * los 3 planes. Si NINGÚN plan tiene otro nivel ni está destacado, es el primer arranque
   * con la columna: se aplica el mapeo base. Después manda lo que edite la plataforma.
   */
  private async nivelesDeMarca(): Promise<void> {
    const yaConfigurado = await this.planRepo.exists({
      where: [{ nivelMarca: Not('ESENCIAL') }, { destacado: true }],
    });
    if (yaConfigurado) return;
    for (const { codigo, nivelMarca, destacado } of PLANES_BASE) {
      await this.planRepo.update({ codigo }, { nivelMarca, destacado });
    }
    this.logger.log('Niveles de marca de los planes base aplicados');
  }

  /** MirrorIA con su marca de siempre; cualquier otra tienda sin fila, con la marca inicial. */
  private async asegurarMarcas(): Promise<void> {
    const conMarca = (await this.marcaRepo.find({ select: { inquilinoId: true } })).map((m) => m.inquilinoId);
    const sinMarca = await this.inquilinoRepo.find({
      where: conMarca.length ? { id: Not(In(conMarca)) } : {},
    });
    for (const i of sinMarca) {
      const datos = i.id === MIRRORIA_TENANT_ID ? MARCA_MIRRORIA : marcaInicial(i.nombre);
      await this.marcaRepo.insert({ inquilinoId: i.id, ...datos });
      this.logger.log(`Marca sembrada para "${i.slug}"`);
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
