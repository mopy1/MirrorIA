import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EntityManager, Repository } from 'typeorm';
import { UsuariosService } from '../../seguridad/service/usuarios.service.js';
import type { EventoPlataformaDto } from '../dto/evento-plataforma.dto.js';
import { type ActorRol, EventoPlataforma, type TipoEvento } from '../entities/evento-plataforma.entity.js';

export interface NuevoEvento {
  inquilinoId: string;
  tipo: TipoEvento;
  detalle?: string | null;
  actorId?: string | null;
  actorRol: ActorRol;
}

/** Bitácora de la plataforma (tabla global): solo inserts. */
@Injectable()
export class EventosPlataformaService {
  constructor(
    @InjectRepository(EventoPlataforma) private readonly repo: Repository<EventoPlataforma>,
    private readonly usuarios: UsuariosService,
  ) {}

  /** Con `manager`, dentro de la transacción del llamador (alta, guardar marca). */
  async registrar(evento: NuevoEvento, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(EventoPlataforma) : this.repo;
    await repo.insert({
      inquilinoId: evento.inquilinoId,
      tipo: evento.tipo,
      detalle: evento.detalle?.slice(0, 255) ?? null,
      actorId: evento.actorId ?? null,
      actorRol: evento.actorRol,
    });
  }

  recientes(limite = 20): Promise<EventoPlataformaDto[]> {
    return this.buscar({}, limite);
  }

  deTienda(inquilinoId: string, limite = 50): Promise<EventoPlataformaDto[]> {
    return this.buscar({ inquilinoId }, limite);
  }

  private async buscar(where: { inquilinoId?: string }, limite: number): Promise<EventoPlataformaDto[]> {
    const eventos = await this.repo.find({
      where,
      relations: { inquilino: true },
      order: { createdAt: 'DESC' },
      take: limite,
    });
    const actores = await this.usuarios.contactosPorIds([
      ...new Set(eventos.map((e) => e.actorId).filter((id): id is string => !!id)),
    ]);
    return eventos.map((e) => ({
      id: e.id,
      tipo: e.tipo,
      detalle: e.detalle,
      actorRol: e.actorRol,
      actorEmail: (e.actorId && actores.get(e.actorId)?.email) || null,
      tienda: { id: e.inquilinoId, nombre: e.inquilino?.nombre ?? '', slug: e.inquilino?.slug ?? '' },
      createdAt: e.createdAt.toISOString(),
    }));
  }
}
