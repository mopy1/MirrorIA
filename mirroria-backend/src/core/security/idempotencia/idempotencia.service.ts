import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity.js';
import { EstadoIdempotencia, Idempotencia } from './entities/idempotencia.entity.js';

export interface RegistrarIntentoParams {
  tenantId: string;
  clave: string;
  ruta: string;
  metodo: string;
  hashCuerpo: string;
  expiraEn?: Date;
}

const TTL_MS = 24 * 60 * 60 * 1000;
/** Ninguna operacion tarda esto: si sigue EN_PROCESO, el proceso se cayo a la mitad. */
const ATASCADA_MS = 60_000;
const BARRIDA_MS = 60 * 60 * 1000;

@Injectable()
export class IdempotenciaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IdempotenciaService.name);
  private barrida: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(Idempotencia)
    private readonly repo: Repository<Idempotencia>,
  ) {}

  onModuleInit(): void {
    this.barrida = setInterval(() => {
      this.limpiarExpiradas().catch((e) => this.logger.warn(`Barrida fallida: ${String(e)}`));
    }, BARRIDA_MS);
    this.barrida.unref();
  }

  onModuleDestroy(): void {
    if (this.barrida) clearInterval(this.barrida);
  }

  /** `expiraEn` lo pone la aplicacion al empezar, asi que dice cuando arranco sin depender de la zona horaria. */
  estaAtascado(registro: Idempotencia): boolean {
    return (
      registro.estado === EstadoIdempotencia.EN_PROCESO &&
      registro.expiraEn.getTime() - TTL_MS + ATASCADA_MS < Date.now()
    );
  }

  /**
   * Busca un registro de idempotencia existente por tenantId y clave.
   */
  async buscar(tenantId: string, clave: string): Promise<Idempotencia | null> {
    return this.repo.findOne({
      where: { tenantId, clave },
    });
  }

  /**
   * Registra un nuevo intento en estado EN_PROCESO con TTL de 24 horas por defecto.
   */
  async registrarIntento(params: RegistrarIntentoParams): Promise<Idempotencia> {
    const expiraEn =
      params.expiraEn ?? new Date(Date.now() + TTL_MS);
    const entidad = this.repo.create({
      tenantId: params.tenantId,
      clave: params.clave,
      ruta: params.ruta,
      metodo: params.metodo.toUpperCase(),
      hashCuerpo: params.hashCuerpo,
      estado: EstadoIdempotencia.EN_PROCESO,
      expiraEn,
    });
    return this.repo.save(entidad);
  }

  /**
   * Valida si el hash del cuerpo actual coincide con el registrado en la base de datos.
   */
  validarHash(existente: Idempotencia, hashActual: string): boolean {
    return existente.hashCuerpo === hashActual;
  }

  /**
   * Transiciona el estado a COMPLETADO y memoriza el status HTTP y el cuerpo de respuesta JSON.
   */
  async marcarCompletado(
    id: string,
    codigoEstado: number,
    cuerpoRespuesta: unknown,
  ): Promise<void> {
    await this.repo.update(id, {
      estado: EstadoIdempotencia.COMPLETADO,
      codigoEstado,
      cuerpoRespuesta:
        (cuerpoRespuesta as QueryDeepPartialEntity<Idempotencia>['cuerpoRespuesta']) ??
        null,
    });
  }

  /**
   * Transiciona el estado a FALLIDO tras una excepción en el controlador.
   */
  async marcarFallido(
    id: string,
    codigoEstado?: number,
    cuerpoRespuesta?: unknown,
  ): Promise<void> {
    await this.repo.update(id, {
      estado: EstadoIdempotencia.FALLIDO,
      codigoEstado: codigoEstado ?? null,
      cuerpoRespuesta:
        (cuerpoRespuesta as QueryDeepPartialEntity<Idempotencia>['cuerpoRespuesta']) ??
        null,
    });
  }

  /**
   * Pasa a EN_PROCESO un registro FALLIDO o abandonado. Condicionado al estado
   * leido: con dos reintentos a la vez solo uno gana y el otro recibe null.
   */
  async reiniciarIntento(
    id: string,
    hashCuerpo: string,
    ruta: string,
    metodo: string,
    estadoEsperado: EstadoIdempotencia = EstadoIdempotencia.FALLIDO,
  ): Promise<Idempotencia | null> {
    const nuevaExpiracion = new Date(Date.now() + TTL_MS);
    const { affected } = await this.repo.update({ id, estado: estadoEsperado }, {
      estado: EstadoIdempotencia.EN_PROCESO,
      hashCuerpo,
      ruta,
      metodo: metodo.toUpperCase(),
      codigoEstado: null,
      cuerpoRespuesta: null,
      expiraEn: nuevaExpiracion,
    });
    if (affected !== 1) return null;
    const actualizada = await this.repo.findOneBy({ id });
    if (!actualizada) {
      throw new Error(`No se encontró el registro de idempotencia con id ${id}`);
    }
    return actualizada;
  }

  /**
   * Purga todos los registros cuya fecha de expiración haya sido superada.
   */
  async limpiarExpiradas(): Promise<number> {
    const res = await this.repo
      .createQueryBuilder()
      .delete()
      .from(Idempotencia)
      .where('expira_en < :ahora', { ahora: new Date() })
      .execute();
    return res.affected ?? 0;
  }
}
