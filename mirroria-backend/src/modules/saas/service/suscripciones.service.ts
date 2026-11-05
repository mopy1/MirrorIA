import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EntityManager } from 'typeorm';
import { In, LessThan, Repository } from 'typeorm';
import type { SuscripcionDto } from '../dto/suscripcion.dto.js';
import type { Inquilino } from '../entities/inquilino.entity.js';
import type { Plan } from '../entities/plan.entity.js';
import { ESTADOS_VIGENTES, EstadoSuscripcion, Suscripcion } from '../entities/suscripcion.entity.js';
import { CambioPlanNoPermitidoException } from '../exception/cambio-plan-no-permitido.exception.js';
import { SinSuscripcionVigenteException } from '../exception/sin-suscripcion-vigente.exception.js';
import { UsoSuperaPlanException } from '../exception/uso-supera-plan.exception.js';
import { diasRestantes, HORAS_BARRIDA, MESES_POR_PAGO, MS_DIA, sumarMeses } from '../saas-reglas.js';
import { EventosPlataformaService } from './eventos-plataforma.service.js';
import { PlanesService } from './planes.service.js';
import { ResolverTenantService } from './resolver-tenant.service.js';
import { UsoPlanService } from './uso-plan.service.js';

/** TRIAL/ACTIVA con `fin` vencido se informa como VENCIDA aunque la barrida no haya corrido. */
export function estadoEfectivo(s: Suscripcion, ahora = Date.now()): EstadoSuscripcion {
  return ESTADOS_VIGENTES.includes(s.estado) && s.fin.getTime() < ahora ? EstadoSuscripcion.VENCIDA : s.estado;
}

export function suscripcionADto(s: Suscripcion): SuscripcionDto {
  return {
    id: s.id,
    estado: estadoEfectivo(s),
    plan: { id: s.plan.id, codigo: s.plan.codigo, nombre: s.plan.nombre },
    inicio: s.inicio.toISOString(),
    fin: s.fin.toISOString(),
    diasRestantes: diasRestantes(s.fin),
    precioCents: s.precioCents,
    proveedorPago: s.proveedorPago,
    referenciaPago: s.referenciaPago,
  };
}

/** Vigencia comercial de las tiendas (tabla global de la plataforma). */
@Injectable()
export class SuscripcionesService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SuscripcionesService.name);
  private barrida: ReturnType<typeof setInterval> | null = null;

  constructor(
    @InjectRepository(Suscripcion) private readonly repo: Repository<Suscripcion>,
    private readonly planes: PlanesService,
    private readonly usoPlan: UsoPlanService,
    private readonly resolver: ResolverTenantService,
    private readonly eventos: EventosPlataformaService,
  ) {}

  onModuleInit(): void {
    this.barrida = setInterval(() => {
      this.vencerVencidas().catch((err) =>
        this.logger.error(`Barrida de suscripciones vencidas falló: ${String(err)}`),
      );
    }, HORAS_BARRIDA * 60 * 60 * 1000);
    this.barrida.unref?.();
  }

  onModuleDestroy(): void {
    if (this.barrida) clearInterval(this.barrida);
  }

  /** TRIAL/ACTIVA con fin pasado → VENCIDA. La disponibilidad no depende de esto (ver resolvedor). */
  async vencerVencidas(): Promise<number> {
    const { affected } = await this.repo.update(
      { estado: In(ESTADOS_VIGENTES), fin: LessThan(new Date()) },
      { estado: EstadoSuscripcion.VENCIDA },
    );
    if (affected) this.resolver.invalidar();
    return affected ?? 0;
  }

  /** Alta: TRIAL por los días de prueba del plan, con el precio congelado. */
  async crearTrial(manager: EntityManager, inquilino: Inquilino, plan: Plan): Promise<Suscripcion> {
    const repo = manager.getRepository(Suscripcion);
    const inicio = new Date();
    return repo.save(
      repo.create({
        inquilino,
        plan,
        estado: EstadoSuscripcion.TRIAL,
        inicio,
        fin: new Date(inicio.getTime() + plan.diasPrueba * MS_DIA),
        precioCents: plan.precioMensualCents,
        proveedorPago: null,
        referenciaPago: null,
        canceladaAt: null,
      }),
    );
  }

  /** Todas, más nuevas primero (la primera es "la más reciente"). */
  historial(inquilinoId: string): Promise<Suscripcion[]> {
    return this.repo.find({
      where: { inquilino: { id: inquilinoId } },
      relations: { plan: true },
      order: { createdAt: 'DESC' },
    });
  }

  async ultima(inquilinoId: string): Promise<Suscripcion> {
    const [ultima] = await this.historial(inquilinoId);
    if (!ultima) throw new SinSuscripcionVigenteException();
    return ultima;
  }

  /**
   * Cambia el plan de la suscripción vigente. Desde el panel de la tienda solo en
   * TRIAL (con cobro llega en la Fase 2); la plataforma puede siempre. 409 si el
   * uso actual no entra en el plan nuevo.
   */
  async cambiarPlan(
    inquilinoId: string, planCodigo: string, desdeLaTienda: boolean, actorId: string | null = null,
  ): Promise<void> {
    const actual = await this.ultima(inquilinoId);
    const estado = estadoEfectivo(actual);
    if (desdeLaTienda && estado !== EstadoSuscripcion.TRIAL) throw new CambioPlanNoPermitidoException();
    if (!ESTADOS_VIGENTES.includes(estado)) throw new SinSuscripcionVigenteException();

    const plan = await this.planes.porCodigo(planCodigo, desdeLaTienda);
    const uso = await this.usoPlan.calcular(inquilinoId);
    const excesos: Array<[number, number | null, string]> = [
      [uso.sucursales, plan.maxSucursales, 'sucursales'],
      [uso.productos, plan.maxProductos, 'productos activos'],
      [uso.usuariosStaff, plan.maxUsuariosStaff, 'usuarios del equipo'],
    ];
    for (const [n, max, recurso] of excesos) {
      if (max !== null && n > max) throw new UsoSuperaPlanException(n, recurso, plan.nombre);
    }
    const antes = actual.plan.nombre;
    actual.plan = plan;
    actual.precioCents = plan.precioMensualCents;
    await this.repo.save(actual);
    this.resolver.invalidar(inquilinoId);
    await this.eventos.registrar({
      inquilinoId, tipo: 'PLAN_CAMBIADO', detalle: `${antes} → ${plan.nombre}`,
      actorId, actorRol: desdeLaTienda ? 'TIENDA' : 'PLATAFORMA',
    });
  }

  /**
   * La plataforma regala días. Vigente: fin += días. Vencida: vuelve a TRIAL
   * (nunca pagó) o ACTIVA (ya había pagado alguna vez), desde hoy.
   */
  async extender(inquilinoId: string, dias: number, actorId: string | null = null): Promise<void> {
    const historial = await this.historial(inquilinoId);
    const actual = historial[0];
    if (!actual) throw new SinSuscripcionVigenteException();
    if (estadoEfectivo(actual) === actual.estado && ESTADOS_VIGENTES.includes(actual.estado)) {
      actual.fin = new Date(actual.fin.getTime() + dias * MS_DIA);
    } else {
      const yaPago = historial.some((s) => s.referenciaPago);
      actual.estado = yaPago ? EstadoSuscripcion.ACTIVA : EstadoSuscripcion.TRIAL;
      actual.fin = new Date(Date.now() + dias * MS_DIA);
    }
    await this.repo.save(actual);
    this.resolver.invalidar(inquilinoId);
    await this.eventos.registrar({
      inquilinoId, tipo: 'VIGENCIA_EXTENDIDA', detalle: `+${dias} días`, actorId, actorRol: 'PLATAFORMA',
    });
  }

  /**
   * HOOK DE LA FASE 2 (ningún controller lo llama todavía): acredita un pago de la
   * suscripción. TRIAL → ACTIVA por 1 mes desde hoy; ACTIVA → fin += 1 mes; sin
   * vigente → fila ACTIVA nueva con el plan de la última.
   */
  async activarPorPago(
    inquilinoId: string,
    pago: { proveedor: string; referencia: string; montoCents: number },
    manager?: EntityManager,
  ): Promise<Suscripcion> {
    const repo = manager ? manager.getRepository(Suscripcion) : this.repo;
    const vigente = await repo.findOne({
      where: { inquilino: { id: inquilinoId }, estado: In(ESTADOS_VIGENTES) },
      relations: { plan: true, inquilino: true },
    });
    const ahora = new Date();
    let fila: Suscripcion;
    if (vigente?.estado === EstadoSuscripcion.TRIAL) {
      fila = Object.assign(vigente, {
        estado: EstadoSuscripcion.ACTIVA,
        inicio: ahora,
        fin: sumarMeses(ahora, MESES_POR_PAGO),
      });
    } else if (vigente) {
      fila = Object.assign(vigente, { fin: sumarMeses(vigente.fin, MESES_POR_PAGO) });
    } else {
      const ultima = await repo.findOne({
        where: { inquilino: { id: inquilinoId } },
        relations: { plan: true, inquilino: true },
        order: { createdAt: 'DESC' },
      });
      if (!ultima) throw new SinSuscripcionVigenteException();
      fila = repo.create({
        inquilino: ultima.inquilino,
        plan: ultima.plan,
        estado: EstadoSuscripcion.ACTIVA,
        inicio: ahora,
        fin: sumarMeses(ahora, MESES_POR_PAGO),
        precioCents: pago.montoCents,
        canceladaAt: null,
      });
    }
    fila.proveedorPago = pago.proveedor;
    fila.referenciaPago = pago.referencia;
    const guardada = await repo.save(fila);
    this.resolver.invalidar(inquilinoId);
    await this.eventos.registrar({
      inquilinoId, tipo: 'PAGO_REGISTRADO', detalle: `${pago.proveedor} ${pago.referencia}`, actorRol: 'SISTEMA',
    }, manager);
    return guardada;
  }
}
