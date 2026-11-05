import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecursoNoEncontradoException } from '../../../core/exception/recurso-no-encontrado.exception.js';
import type { DisponibilidadSlugDto } from '../dto/disponibilidad-slug.dto.js';
import type { TiendaPublicaDto } from '../dto/tienda-publica.dto.js';
import { Inquilino } from '../entities/inquilino.entity.js';
import { marcaInicial } from '../marca/marca-reglas.js';
import { MIRRORIA_TENANT_ID, REGEX_SLUG, SLUGS_RESERVADOS } from '../saas-reglas.js';
import { estaDisponible, nivelDe, tiendaADto } from './inquilinos.helpers.js';
import { InquilinosService } from './inquilinos.service.js';
import { efectivaPublica, MarcaService } from './marca.service.js';
import { SuscripcionesService } from './suscripciones.service.js';

/** Lo público de las tiendas: directorio de la landing, resolver por slug y disponibilidad del slug. */
@Injectable()
export class TiendasPublicasService {
  constructor(
    @InjectRepository(Inquilino) private readonly repo: Repository<Inquilino>,
    private readonly inquilinos: InquilinosService,
    private readonly suscripciones: SuscripcionesService,
    private readonly marcas: MarcaService,
  ) {}

  /** Directorio de la landing: solo disponibles, más nuevas primero, MirrorIA siempre primera. Sin N+1. */
  async tiendasPublicas(limite = 12): Promise<TiendaPublicaDto[]> {
    const [ultimas, inquilinos] = await Promise.all([
      this.inquilinos.ultimasPorInquilino(),
      this.repo.find({ order: { createdAt: 'DESC' } }),
    ]);
    const abiertas = inquilinos
      .filter((i) => estaDisponible(i, ultimas.get(i.id)))
      .sort((a, b) => Number(b.id === MIRRORIA_TENANT_ID) - Number(a.id === MIRRORIA_TENANT_ID))
      .slice(0, limite);
    const marcas = await this.marcas.guardadasPorInquilino(abiertas.map((i) => i.id));
    return abiertas.map((i) => {
      const u = ultimas.get(i.id);
      return tiendaADto(i, u, efectivaPublica(marcas.get(i.id) ?? marcaInicial(i.nombre), nivelDe(u)));
    });
  }

  async tiendaPublica(slug: string): Promise<TiendaPublicaDto> {
    const inquilino = await this.repo.findOne({ where: { slug: slug.trim().toLowerCase() } });
    if (!inquilino) throw new RecursoNoEncontradoException('Tienda', slug);
    const [[ultima], guardada] = await Promise.all([
      this.suscripciones.historial(inquilino.id),
      this.marcas.guardada(inquilino.id, inquilino.nombre),
    ]);
    return tiendaADto(inquilino, ultima, efectivaPublica(guardada, nivelDe(ultima)));
  }

  async disponibilidad(crudo: string): Promise<DisponibilidadSlugDto> {
    const slug = crudo.trim().toLowerCase();
    if (!REGEX_SLUG.test(slug)) return { slug, disponible: false, motivo: 'FORMATO' };
    if (SLUGS_RESERVADOS.includes(slug)) return { slug, disponible: false, motivo: 'RESERVADO' };
    if (await this.repo.exists({ where: { slug } })) return { slug, disponible: false, motivo: 'OCUPADO' };
    return { slug, disponible: true, motivo: null };
  }
}
