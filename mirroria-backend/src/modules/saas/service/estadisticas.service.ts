import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';
import type { EstadisticasPublicasDto } from '../dto/estadisticas-publicas.dto.js';
import { TiendasPublicasService } from './tiendas-publicas.service.js';

const TTL_MS = 5 * 60 * 1000;

/** Cifras vivas de la landing (solo tiendas abiertas al público). Caché en memoria de 5 min. */
@Injectable()
export class EstadisticasService {
  private cache: { valor: EstadisticasPublicasDto; vence: number } | null = null;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly tiendas: TiendasPublicasService,
  ) {}

  async publicas(): Promise<EstadisticasPublicasDto> {
    if (this.cache && this.cache.vence > Date.now()) return this.cache.valor;
    const ids = (await this.tiendas.tiendasPublicas(Number.MAX_SAFE_INTEGER)).map((t) => t.id);
    const [f]: Array<{ prendas: number; ciudades: number }> = await this.dataSource.query(
      `SELECT (SELECT count(*) FROM productos WHERE activo AND tenant_id = ANY($1::uuid[]))::int AS prendas,
              (SELECT count(DISTINCT ciudad_id) FROM sucursales WHERE activo AND tenant_id = ANY($1::uuid[]))::int AS ciudades`,
      [ids],
    );
    const valor = { tiendasAbiertas: ids.length, prendasPublicadas: f?.prendas ?? 0, ciudades: f?.ciudades ?? 0 };
    this.cache = { valor, vence: Date.now() + TTL_MS };
    return valor;
  }
}
