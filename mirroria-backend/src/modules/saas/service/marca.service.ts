import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { type DataSource, type EntityManager, In, type Repository } from 'typeorm';
import { RecursoNoEncontradoException } from '../../../core/exception/recurso-no-encontrado.exception.js';
import { SolicitudInvalidaException } from '../../../core/exception/solicitud-invalida.exception.js';
import type { ActualizarMarcaDto, MarcaMiniDto, MarcaPublicaDto, MiMarcaDto } from '../dto/marca.dto.js';
import type { ActorRol } from '../entities/evento-plataforma.entity.js';
import { Inquilino } from '../entities/inquilino.entity.js';
import { MarcaTienda } from '../entities/marca-tienda.entity.js';
import { MarcaFueraDelPlanException } from '../exception/marca-fuera-del-plan.exception.js';
import { formatearRatio, validarPrincipal } from '../marca/marca-color.js';
import {
  type CodigoPaleta, type DatosMarca, fueraDelPlan, marcaEfectiva, marcaInicial, marcaPorDefecto,
  type NivelMarca, permitidoPorNivel, restablecerSeccion, SECCION_TEXTO, type SeccionMarca,
} from '../marca/marca-reglas.js';
import { EventosPlataformaService } from './eventos-plataforma.service.js';
import { ResolverTenantService } from './resolver-tenant.service.js';

export function aDatos(f: MarcaTienda): DatosMarca {
  const { id: _id, inquilinoId: _i, inquilino: _q, createdAt: _c, updatedAt: _u, ...datos } = f;
  return datos;
}

export function aPublica(d: DatosMarca): MarcaPublicaDto {
  return {
    logoUrl: d.logoUrl, faviconUrl: d.faviconUrl, colorPrimario: d.colorPrimario, colorAcento: d.colorAcento,
    modo: d.modo, radio: d.radio, fuente: d.fuente,
    hero: {
      imagenUrl: d.heroImagenUrl, titulo: d.heroTitulo, subtitulo: d.heroSubtitulo,
      ctaTexto: d.heroCtaTexto, ctaDestino: d.heroCtaDestino, mostrarProbador: d.heroMostrarProbador,
    },
    imagenes: { bannerSucursales: d.bannerSucursalesUrl, probador: d.imagenProbadorUrl, acceso: d.imagenAccesoUrl },
    textos: { eslogan: d.eslogan, sobreNosotros: d.sobreNosotros },
    contacto: { instagram: d.instagram, facebook: d.facebook, tiktok: d.tiktok, whatsapp: d.whatsapp, email: d.emailContacto },
    mostrarInsignia: d.mostrarInsignia,
  };
}

export function desdePublica(m: MarcaPublicaDto, paleta: string): DatosMarca {
  const n = <T>(v: T | undefined): T | null => v ?? null;
  return {
    paleta, logoUrl: n(m.logoUrl), faviconUrl: n(m.faviconUrl),
    colorPrimario: m.colorPrimario, colorAcento: m.colorAcento, modo: m.modo, radio: m.radio, fuente: m.fuente,
    heroImagenUrl: m.hero.imagenUrl, heroTitulo: m.hero.titulo, heroSubtitulo: n(m.hero.subtitulo),
    heroCtaTexto: m.hero.ctaTexto, heroCtaDestino: m.hero.ctaDestino, heroMostrarProbador: m.hero.mostrarProbador,
    bannerSucursalesUrl: n(m.imagenes.bannerSucursales), imagenProbadorUrl: n(m.imagenes.probador),
    imagenAccesoUrl: n(m.imagenes.acceso), eslogan: n(m.textos.eslogan), sobreNosotros: n(m.textos.sobreNosotros),
    instagram: n(m.contacto.instagram), facebook: n(m.contacto.facebook), tiktok: n(m.contacto.tiktok),
    whatsapp: n(m.contacto.whatsapp), emailContacto: n(m.contacto.email), mostrarInsignia: m.mostrarInsignia,
  };
}

export const aMini = (d: DatosMarca): MarcaMiniDto => ({
  logoUrl: d.logoUrl, colorPrimario: d.colorPrimario, heroImagenUrl: d.heroImagenUrl,
});

/** Marca de cada tienda (tabla global 1:1 con inquilinos). La escribe su ADMIN o la plataforma. */
@Injectable()
export class MarcaService {
  constructor(
    @InjectRepository(MarcaTienda) private readonly repo: Repository<MarcaTienda>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly resolver: ResolverTenantService,
    private readonly eventos: EventosPlataformaService,
  ) {}

  /** Alta de tienda: dentro de la transacción del aprovisionamiento. */
  async crearInicial(manager: EntityManager, inquilinoId: string, nombre: string, paleta?: CodigoPaleta): Promise<void> {
    await manager.getRepository(MarcaTienda).insert({ inquilinoId, ...marcaInicial(nombre, paleta) });
  }

  /** Lo guardado de cada tienda en UN solo SELECT (directorio y listados, sin N+1). */
  async guardadasPorInquilino(ids: string[]): Promise<Map<string, DatosMarca>> {
    if (ids.length === 0) return new Map();
    const filas = await this.repo.find({ where: { inquilinoId: In(ids) } });
    return new Map(filas.map((f) => [f.inquilinoId, aDatos(f)]));
  }

  async guardada(inquilinoId: string, nombre: string): Promise<DatosMarca> {
    const fila = await this.repo.findOne({ where: { inquilinoId } });
    return fila ? aDatos(fila) : marcaInicial(nombre);
  }

  async miMarca(tenantId: string): Promise<MiMarcaDto> {
    const info = await this.resolver.porId(tenantId);
    if (!info) throw new RecursoNoEncontradoException('Tienda', tenantId);
    const guardada = await this.guardada(tenantId, info.nombre);
    return {
      nombre: info.nombre, slug: info.slug, paleta: guardada.paleta as CodigoPaleta | 'mirroria',
      guardada: aPublica(guardada), efectiva: aPublica(marcaEfectiva(guardada, info.nivelMarca)),
      nivel: info.nivelMarca, planNombre: info.planNombre ?? 'Sin plan', permitido: permitidoPorNivel(info.nivelMarca),
    };
  }

  /** PUT completo: valida contraste (400) y nivel del plan (409); nombre + marca + evento en una transacción. */
  async guardar(tenantId: string, dto: ActualizarMarcaDto, actorId: string): Promise<MiMarcaDto> {
    const info = await this.resolver.porId(tenantId);
    if (!info) throw new RecursoNoEncontradoException('Tienda', tenantId);
    const actual = await this.guardada(tenantId, info.nombre);
    const nueva = desdePublica(dto, actual.paleta);
    validarContraste(nueva);
    const fuera = fueraDelPlan(nueva, actual, info.nivelMarca);
    if (fuera) throw new MarcaFueraDelPlanException(info.planNombre ?? 'actual', fuera);
    await this.dataSource.transaction(async (m) => {
      await this.escribir(m, tenantId, nueva);
      await m.getRepository(Inquilino).update({ id: tenantId }, { nombre: dto.nombre });
      await this.eventos.registrar({ inquilinoId: tenantId, tipo: 'MARCA_ACTUALIZADA', actorId, actorRol: 'TIENDA' }, m);
    });
    this.resolver.invalidar(tenantId);
    return this.miMarca(tenantId);
  }

  /** Vuelve una sección (o TODO) a los valores por defecto de su paleta. Nunca toca nombre ni paleta. */
  async restablecer(
    tenantId: string, nombre: string, seccion: SeccionMarca,
    actor: { id: string | null; rol: ActorRol; motivo?: string },
  ): Promise<void> {
    const actual = await this.guardada(tenantId, nombre);
    const nueva = restablecerSeccion(actual, seccion, marcaPorDefecto(nombre, actual.paleta));
    const detalle = actor.motivo ? `${SECCION_TEXTO[seccion]}: ${actor.motivo}` : SECCION_TEXTO[seccion];
    await this.dataSource.transaction(async (m) => {
      await this.escribir(m, tenantId, nueva);
      await this.eventos.registrar(
        { inquilinoId: tenantId, tipo: 'MARCA_RESTABLECIDA', detalle, actorId: actor.id, actorRol: actor.rol }, m);
    });
    this.resolver.invalidar(tenantId);
  }

  private async escribir(m: EntityManager, inquilinoId: string, datos: DatosMarca): Promise<void> {
    const repo = m.getRepository(MarcaTienda);
    if (await repo.exists({ where: { inquilinoId } })) await repo.update({ inquilinoId }, datos);
    else await repo.insert({ inquilinoId, ...datos });
  }
}

export function efectivaPublica(d: DatosMarca, nivel: NivelMarca): MarcaPublicaDto {
  return aPublica(marcaEfectiva(d, nivel));
}

function validarContraste(d: DatosMarca): void {
  const { ok, ratio } = validarPrincipal(d.colorPrimario, d.modo);
  if (ok) return;
  const fondo = d.modo === 'OSCURO' ? 'oscuro' : 'claro';
  throw new SolicitudInvalidaException(
    `El color principal ${d.colorPrimario} tiene un contraste de ${formatearRatio(ratio)} con el fondo ${fondo}; necesita 4.5:1`,
  );
}
