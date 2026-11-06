import { Injectable } from '@nestjs/common';
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

@Injectable()
export class IdempotenciaService {
  constructor(
    @InjectRepository(Idempotencia)
    private readonly repo: Repository<Idempotencia>,
  ) {}

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
      params.expiraEn ?? new Date(Date.now() + 24 * 60 * 60 * 1000);
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
   * Reinicia un registro en estado FALLIDO a EN_PROCESO para permitir un reintento limpio.
   */
  async reiniciarIntento(
    id: string,
    hashCuerpo: string,
    ruta: string,
    metodo: string,
    expiraEn?: Date,
  ): Promise<Idempotencia> {
    const nuevaExpiracion =
      expiraEn ?? new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.repo.update(id, {
      estado: EstadoIdempotencia.EN_PROCESO,
      hashCuerpo,
      ruta,
      metodo: metodo.toUpperCase(),
      codigoEstado: null,
      cuerpoRespuesta: null,
      expiraEn: nuevaExpiracion,
    });
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
