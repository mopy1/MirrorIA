import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';
import type { LimitesPlan } from '../../../core/tenancy/tenant-context.js';
import type { NivelMarca } from '../marca/marca-reglas.js';
import { SEGUNDOS_CACHE_TENANT } from '../saas-reglas.js';

export interface InfoTenant {
  id: string;
  slug: string;
  nombre: string;
  /** inquilino ACTIVO + suscripción más reciente TRIAL/ACTIVA con fin >= ahora. */
  disponible: boolean;
  planNombre: string | null;
  limites: LimitesPlan | null;
  /** Nivel de marca del plan de la suscripción más reciente (ESENCIAL si no tiene). */
  nivelMarca: NivelMarca;
}

interface FilaTenant {
  id: string;
  slug: string;
  nombre: string;
  estado: string;
  sus_estado: string | null;
  fin: Date | null;
  plan_nombre: string | null;
  max_sucursales: number | null;
  max_productos: number | null;
  max_usuarios_staff: number | null;
  nivel_marca: NivelMarca | null;
}

/**
 * Resuelve una tienda por slug o por id con su suscripción más reciente y su plan.
 * Caché Map con TTL de 60 s (una sola instancia, mismo criterio que LimitadorPorIp):
 * todo servicio de saas que cambia una tienda, plan o suscripción llama invalidar().
 */
@Injectable()
export class ResolverTenantService {
  private readonly cache = new Map<string, { info: InfoTenant | null; vence: number }>();

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  porSlug(slug: string): Promise<InfoTenant | null> {
    return this.resolver(`slug:${slug}`, 'i.slug = $1', slug);
  }

  porId(id: string): Promise<InfoTenant | null> {
    return this.resolver(`id:${id}`, 'i.id = $1', id);
  }

  /** Sin id, vacía toda la caché (cambio de un plan que usan varias tiendas). */
  invalidar(id?: string): void {
    if (!id) {
      this.cache.clear();
      return;
    }
    for (const [clave, valor] of this.cache) {
      if (clave === `id:${id}` || valor.info?.id === id) this.cache.delete(clave);
    }
  }

  private async resolver(clave: string, condicion: string, valor: string): Promise<InfoTenant | null> {
    const enCache = this.cache.get(clave);
    if (enCache && enCache.vence > Date.now()) return enCache.info;

    // Tablas globales de la plataforma: no llevan tenant_id.
    const filas: FilaTenant[] = await this.dataSource.query(
      `SELECT i.id, i.slug, i.nombre, i.estado, s.estado AS sus_estado, s.fin,
              p.nombre AS plan_nombre, p.max_sucursales, p.max_productos, p.max_usuarios_staff,
              p.nivel_marca
         FROM inquilinos i
         LEFT JOIN LATERAL (
           SELECT * FROM suscripciones s WHERE s.inquilino_id = i.id
            ORDER BY s."createdAt" DESC LIMIT 1
         ) s ON true
         LEFT JOIN planes p ON p.id = s.plan_id
        WHERE ${condicion}`,
      [valor],
    );
    const info = filas[0] ? aInfo(filas[0]) : null;
    this.cache.set(clave, { info, vence: Date.now() + SEGUNDOS_CACHE_TENANT * 1000 });
    return info;
  }
}

function aInfo(f: FilaTenant): InfoTenant {
  const vigente =
    (f.sus_estado === 'TRIAL' || f.sus_estado === 'ACTIVA') && !!f.fin && f.fin.getTime() >= Date.now();
  return {
    id: f.id,
    slug: f.slug,
    nombre: f.nombre,
    disponible: f.estado === 'ACTIVO' && vigente,
    planNombre: f.plan_nombre,
    limites: f.plan_nombre
      ? {
          maxSucursales: f.max_sucursales,
          maxProductos: f.max_productos,
          maxUsuariosStaff: f.max_usuarios_staff,
        }
      : null,
    nivelMarca: f.nivel_marca ?? 'ESENCIAL',
  };
}
