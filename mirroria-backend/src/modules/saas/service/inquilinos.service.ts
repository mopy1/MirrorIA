import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperacionInvalidaException } from '../../../core/exception/operacion-invalida.exception.js';
import { RecursoNoEncontradoException } from '../../../core/exception/recurso-no-encontrado.exception.js';
import { UsuariosService } from '../../seguridad/service/usuarios.service.js';
import type { CambiarEstadoInquilinoDto } from '../dto/cambiar-estado-inquilino.dto.js';
import type { DisponibilidadSlugDto } from '../dto/disponibilidad-slug.dto.js';
import type { FiltroInquilinosDto, InquilinoDetalleDto, InquilinoResumenDto } from '../dto/inquilino.dto.js';
import type { ResumenPlataformaDto } from '../dto/resumen-plataforma.dto.js';
import type { UsoPlanDto } from '../dto/suscripcion.dto.js';
import type { TiendaPublicaDto } from '../dto/tienda-publica.dto.js';
import { EstadoInquilino, Inquilino } from '../entities/inquilino.entity.js';
import { EstadoSuscripcion, Suscripcion } from '../entities/suscripcion.entity.js';
import { diasRestantes, MIRRORIA_TENANT_ID, MS_DIA, REGEX_SLUG, SLUGS_RESERVADOS } from '../saas-reglas.js';
import { ResolverTenantService } from './resolver-tenant.service.js';
import { estadoEfectivo, suscripcionADto, SuscripcionesService } from './suscripciones.service.js';
import { UsoPlanService } from './uso-plan.service.js';

const USO_VACIO: UsoPlanDto = { sucursales: 0, productos: 0, usuariosStaff: 0 };

export function tiendaADto(i: Inquilino, ultima: Suscripcion | undefined): TiendaPublicaDto {
  return { id: i.id, slug: i.slug, nombre: i.nombre, disponible: estaDisponible(i, ultima) };
}

function estaDisponible(i: Inquilino, ultima: Suscripcion | undefined): boolean {
  if (i.estado !== EstadoInquilino.ACTIVO || !ultima) return false;
  const estado = estadoEfectivo(ultima);
  return estado === EstadoSuscripcion.TRIAL || estado === EstadoSuscripcion.ACTIVA;
}

/** Tiendas: directorio público y panel de la plataforma (tablas globales). */
@Injectable()
export class InquilinosService {
  constructor(
    @InjectRepository(Inquilino) private readonly repo: Repository<Inquilino>,
    @InjectRepository(Suscripcion) private readonly suscripcionRepo: Repository<Suscripcion>,
    private readonly suscripciones: SuscripcionesService,
    private readonly usoPlan: UsoPlanService,
    private readonly usuarios: UsuariosService,
    private readonly resolver: ResolverTenantService,
  ) {}

  /** Directorio de la landing: solo disponibles, más nuevas primero, MirrorIA siempre primera. */
  async tiendasPublicas(limite = 12): Promise<TiendaPublicaDto[]> {
    const ultimas = await this.ultimasPorInquilino();
    const tiendas = (await this.repo.find({ order: { createdAt: 'DESC' } }))
      .map((i) => tiendaADto(i, ultimas.get(i.id)))
      .filter((t) => t.disponible)
      .sort((a, b) => Number(b.id === MIRRORIA_TENANT_ID) - Number(a.id === MIRRORIA_TENANT_ID));
    return tiendas.slice(0, limite);
  }

  async tiendaPublica(slug: string): Promise<TiendaPublicaDto> {
    const inquilino = await this.repo.findOne({ where: { slug: slug.trim().toLowerCase() } });
    if (!inquilino) throw new RecursoNoEncontradoException('Tienda', slug);
    const [ultima] = await this.suscripciones.historial(inquilino.id);
    return tiendaADto(inquilino, ultima);
  }

  async disponibilidad(crudo: string): Promise<DisponibilidadSlugDto> {
    const slug = crudo.trim().toLowerCase();
    if (!REGEX_SLUG.test(slug)) return { slug, disponible: false, motivo: 'FORMATO' };
    if (SLUGS_RESERVADOS.includes(slug)) return { slug, disponible: false, motivo: 'RESERVADO' };
    if (await this.repo.exists({ where: { slug } })) return { slug, disponible: false, motivo: 'OCUPADO' };
    return { slug, disponible: true, motivo: null };
  }

  async listar(filtro: FiltroInquilinosDto = {}): Promise<InquilinoResumenDto[]> {
    const inquilinos = await this.repo.find({ order: { createdAt: 'DESC' } });
    const [ultimas, uso, contactos] = await Promise.all([
      this.ultimasPorInquilino(),
      this.usoPlan.calcularTodos(),
      this.usuarios.contactosPorIds(inquilinos.map((i) => i.propietarioId).filter((id): id is string => !!id)),
    ]);
    const q = filtro.q?.trim().toLowerCase();
    return inquilinos
      .map((i) => this.aResumen(i, ultimas.get(i.id), uso.get(i.id), contactos))
      .filter((r) => !filtro.estado || r.estado === filtro.estado)
      .filter((r) => !filtro.suscripcion || r.suscripcion.estado === filtro.suscripcion)
      .filter((r) => !q || r.nombre.toLowerCase().includes(q) || r.slug.includes(q));
  }

  async detalle(id: string): Promise<InquilinoDetalleDto> {
    const inquilino = await this.buscar(id);
    const [historial, uso, contactos, ventas] = await Promise.all([
      this.suscripciones.historial(id),
      this.usoPlan.calcular(id),
      this.usuarios.contactosPorIds(inquilino.propietarioId ? [inquilino.propietarioId] : []),
      this.usoPlan.ventasPagadas30d(id),
    ]);
    const resumen = this.aResumen(inquilino, historial[0], uso, contactos);
    const plan = historial[0]?.plan;
    return {
      ...resumen,
      motivoSuspension: inquilino.motivoSuspension,
      limites: {
        maxSucursales: plan?.maxSucursales ?? null,
        maxProductos: plan?.maxProductos ?? null,
        maxUsuariosStaff: plan?.maxUsuariosStaff ?? null,
      },
      historial: historial.map(suscripcionADto),
      sucursales: uso.sucursales,
      productos: uso.productos,
      ventasPagadas30d: ventas,
    };
  }

  async cambiarEstado(id: string, dto: CambiarEstadoInquilinoDto): Promise<InquilinoDetalleDto> {
    const inquilino = await this.buscar(id);
    if (inquilino.estado === dto.estado) {
      throw new OperacionInvalidaException(`La tienda ya está ${dto.estado}`);
    }
    inquilino.estado = dto.estado;
    inquilino.motivoSuspension = dto.estado === EstadoInquilino.SUSPENDIDO ? dto.motivo!.trim() : null;
    await this.repo.save(inquilino);
    this.resolver.invalidar(id);
    return this.detalle(id);
  }

  async cambiarPlan(id: string, planCodigo: string): Promise<InquilinoDetalleDto> {
    await this.buscar(id);
    await this.suscripciones.cambiarPlan(id, planCodigo, false);
    return this.detalle(id);
  }

  async extender(id: string, dias: number): Promise<InquilinoDetalleDto> {
    await this.buscar(id);
    await this.suscripciones.extender(id, dias);
    return this.detalle(id);
  }

  async resumen(): Promise<ResumenPlataformaDto> {
    const todos = await this.listar();
    const ultimas = await this.ultimasPorInquilino();
    const ahora = Date.now();
    const mrrCents = [...ultimas.values()]
      .filter((s) => estadoEfectivo(s, ahora) === EstadoSuscripcion.ACTIVA)
      .reduce((total, s) => total + s.precioCents, 0);
    return {
      inquilinos: {
        total: todos.length,
        activos: todos.filter((t) => t.estado === EstadoInquilino.ACTIVO).length,
        suspendidos: todos.filter((t) => t.estado === EstadoInquilino.SUSPENDIDO).length,
        enTrial: todos.filter((t) => t.suscripcion.estado === EstadoSuscripcion.TRIAL).length,
        vencidos: todos.filter((t) => t.suscripcion.estado === EstadoSuscripcion.VENCIDA).length,
      },
      mrrCents,
      altasUltimos30Dias: todos.filter((t) => Date.parse(t.createdAt) >= ahora - 30 * MS_DIA).length,
      trialsPorVencer: todos.filter(
        (t) => t.suscripcion.estado === EstadoSuscripcion.TRIAL && t.suscripcion.diasRestantes <= 7,
      ),
    };
  }

  private async buscar(id: string): Promise<Inquilino> {
    const inquilino = await this.repo.findOne({ where: { id } });
    if (!inquilino) throw new RecursoNoEncontradoException('Tienda', id);
    return inquilino;
  }

  /** La suscripción más reciente de cada tienda. */
  private async ultimasPorInquilino(): Promise<Map<string, Suscripcion>> {
    const todas = await this.suscripcionRepo.find({
      relations: { plan: true, inquilino: true },
      order: { createdAt: 'DESC' },
    });
    const ultimas = new Map<string, Suscripcion>();
    for (const s of todas) if (!ultimas.has(s.inquilino.id)) ultimas.set(s.inquilino.id, s);
    return ultimas;
  }

  private aResumen(
    i: Inquilino,
    ultima: Suscripcion | undefined,
    uso: UsoPlanDto | undefined,
    contactos: Map<string, { fullName: string; email: string }>,
  ): InquilinoResumenDto {
    return {
      id: i.id,
      nombre: i.nombre,
      slug: i.slug,
      estado: i.estado,
      disponible: estaDisponible(i, ultima),
      plan: { codigo: ultima?.plan.codigo ?? '', nombre: ultima?.plan.nombre ?? 'Sin plan' },
      suscripcion: {
        estado: ultima ? estadoEfectivo(ultima) : EstadoSuscripcion.VENCIDA,
        fin: ultima?.fin.toISOString() ?? i.createdAt.toISOString(),
        diasRestantes: ultima ? diasRestantes(ultima.fin) : 0,
      },
      propietario: (i.propietarioId && contactos.get(i.propietarioId)) || null,
      uso: uso ?? { ...USO_VACIO },
      createdAt: i.createdAt.toISOString(),
    };
  }
}
