import type { ActorRol, TipoEvento } from '../entities/evento-plataforma.entity.js';

export class EventoPlataformaDto {
  id!: string;
  tipo!: TipoEvento;
  detalle!: string | null;
  actorRol!: ActorRol;
  actorEmail!: string | null;
  tienda!: { id: string; nombre: string; slug: string };
  createdAt!: string;
}
