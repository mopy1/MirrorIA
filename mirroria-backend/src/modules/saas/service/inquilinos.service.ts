import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperacionInvalidaException } from '../../../core/exception/operacion-invalida.exception.js';
import { RecursoNoEncontradoException } from '../../../core/exception/recurso-no-encontrado.exception.js';
import { UsuariosService } from '../../seguridad/service/usuarios.service.js';
import type { CambiarEstadoInquilinoDto } from '../dto/cambiar-estado-inquilino.dto.js';
import type { FiltroInquilinosDto, InquilinoDetalleDto, InquilinoResumenDto } from '../dto/inquilino.dto.js';
import type { RestablecerMarcaPlataformaDto } from '../dto/restablecer-marca-plataforma.dto.js';
import type { ResumenPlataformaDto } from '../dto/resumen-plataforma.dto.js';
import { EstadoInquilino, Inquilino } from '../entities/inquilino.entity.js';
import { EstadoSuscripcion, Suscripcion } from '../entities/suscripcion.entity.js';
import { MS_DIA } from '../saas-reglas.js';
import { EventosPlataformaService } from './eventos-plataforma.service.js';
import { nivelDe, ORDENAR, resumenDe } from './inquilinos.helpers.js';
import { efectivaPublica, MarcaService } from './marca.service.js';
import { ResolverTenantService } from './resolver-tenant.service.js';
import { suscripcionADto, SuscripcionesService } from './suscripciones.service.js';
import { UsoPlanService } from './uso-plan.service.js';

/** Tiendas en el panel de la plataforma (tablas globales). El directorio público vive en TiendasPublicasService. */
@Injectable()
export class InquilinosService {
  constructor(
    @InjectRepository(Inquilino) private readonly repo: Repository<Inquilino>,
    @InjectRepository(Suscripcion) private readonly suscripcionRepo: Repository<Suscripcion>,
    private readonly suscripciones: SuscripcionesService,
    private readonly usoPlan: UsoPlanService,
    private readonly usuarios: UsuariosService,
    private readonly resolver: ResolverTenantService,
    private readonly marcas: MarcaService,
    private readonly eventos: EventosPlataformaService,
  ) {}

  async listar(filtro: FiltroInquilinosDto = {}): Promise<InquilinoResumenDto[]> {
    const inquilinos = await this.repo.find({ order: { createdAt: 'DESC' } });
    const [ultimas, uso, contactos, marcas] = await Promise.all([
      this.ultimasPorInquilino(),
      this.usoPlan.calcularTodos(),
      this.usuarios.contactosPorIds(inquilinos.map((i) => i.propietarioId).filter((id): id is string => !!id)),
      this.marcas.guardadasPorInquilino(inquilinos.map((i) => i.id)),
    ]);
    const q = filtro.q?.trim().toLowerCase();
    return inquilinos
      .map((i) => resumenDe(i, ultimas.get(i.id), uso.get(i.id), contactos, marcas.get(i.id)))
      .filter((r) => !filtro.estado || r.estado === filtro.estado)
      .filter((r) => !filtro.suscripcion || r.suscripcion.estado === filtro.suscripcion)
      .filter((r) => !filtro.plan || r.plan.codigo === filtro.plan.trim().toLowerCase())
      .filter((r) => !q || [r.nombre.toLowerCase(), r.slug, r.propietario?.email ?? ''].some((t) => t.includes(q)))
      .sort(ORDENAR[filtro.orden ?? 'recientes']);
  }

  async detalle(id: string): Promise<InquilinoDetalleDto> {
    const inquilino = await this.buscar(id);
    const [historial, uso, contactos, ventas, guardada, actividad] = await Promise.all([
      this.suscripciones.historial(id),
      this.usoPlan.calcular(id),
      this.usuarios.contactosPorIds(inquilino.propietarioId ? [inquilino.propietarioId] : []),
      this.usoPlan.ventasPagadas30d(id),
      this.marcas.guardada(id, inquilino.nombre),
      this.eventos.deTienda(id, 50),
    ]);
    const resumen = resumenDe(inquilino, historial[0], uso, contactos, guardada);
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
      marcaCompleta: efectivaPublica(guardada, nivelDe(historial[0])),
      nivelMarca: nivelDe(historial[0]),
      actividad,
    };
  }

  async cambiarEstado(id: string, dto: CambiarEstadoInquilinoDto, actorId: string | null = null): Promise<InquilinoDetalleDto> {
    const inquilino = await this.buscar(id);
    if (inquilino.estado === dto.estado) {
      throw new OperacionInvalidaException(`La tienda ya está ${dto.estado}`);
    }
    const suspender = dto.estado === EstadoInquilino.SUSPENDIDO;
    inquilino.estado = dto.estado;
    inquilino.motivoSuspension = suspender ? dto.motivo!.trim() : null;
    await this.repo.save(inquilino);
    this.resolver.invalidar(id);
    await this.eventos.registrar({
      inquilinoId: id, tipo: suspender ? 'SUSPENDIDA' : 'REACTIVADA',
      detalle: inquilino.motivoSuspension, actorId, actorRol: 'PLATAFORMA',
    });
    return this.detalle(id);
  }

  async cambiarPlan(id: string, planCodigo: string, actorId: string | null = null): Promise<InquilinoDetalleDto> {
    await this.buscar(id);
    await this.suscripciones.cambiarPlan(id, planCodigo, false, actorId);
    return this.detalle(id);
  }

  async extender(id: string, dias: number, actorId: string | null = null): Promise<InquilinoDetalleDto> {
    await this.buscar(id);
    await this.suscripciones.extender(id, dias, actorId);
    return this.detalle(id);
  }

  /** Moderación de la plataforma: restablece la marca y deja el motivo en la bitácora. */
  async restablecerMarca(id: string, dto: RestablecerMarcaPlataformaDto, actorId: string): Promise<InquilinoDetalleDto> {
    const inquilino = await this.buscar(id);
    await this.marcas.restablecer(id, inquilino.nombre, dto.seccion, { id: actorId, rol: 'PLATAFORMA', motivo: dto.motivo });
    return this.detalle(id);
  }

  /** Fase 1 (se mantiene por compatibilidad; el panel nuevo usa /saas/plataforma/dashboard). */
  async resumen(): Promise<ResumenPlataformaDto> {
    const todos = await this.listar();
    const ahora = Date.now();
    return {
      inquilinos: {
        total: todos.length,
        activos: todos.filter((t) => t.estado === EstadoInquilino.ACTIVO).length,
        suspendidos: todos.filter((t) => t.estado === EstadoInquilino.SUSPENDIDO).length,
        enTrial: todos.filter((t) => t.suscripcion.estado === EstadoSuscripcion.TRIAL).length,
        vencidos: todos.filter((t) => t.suscripcion.estado === EstadoSuscripcion.VENCIDA).length,
      },
      mrrCents: todos.reduce((total, t) => total + t.mrrCents, 0),
      altasUltimos30Dias: todos.filter((t) => Date.parse(t.createdAt) >= ahora - 30 * MS_DIA).length,
      trialsPorVencer: todos.filter(
        (t) => t.suscripcion.estado === EstadoSuscripcion.TRIAL && t.suscripcion.diasRestantes <= 7,
      ),
    };
  }

  /** 404 si no existe (lo usan las métricas de plataforma antes del SQL por tenant). */
  async buscar(id: string): Promise<Inquilino> {
    const inquilino = await this.repo.findOne({ where: { id } });
    if (!inquilino) throw new RecursoNoEncontradoException('Tienda', id);
    return inquilino;
  }

  /** La suscripción más reciente de cada tienda. */
  async ultimasPorInquilino(): Promise<Map<string, Suscripcion>> {
    const todas = await this.suscripcionRepo.find({
      relations: { plan: true, inquilino: true },
      order: { createdAt: 'DESC' },
    });
    const ultimas = new Map<string, Suscripcion>();
    for (const s of todas) if (!ultimas.has(s.inquilino.id)) ultimas.set(s.inquilino.id, s);
    return ultimas;
  }
}
