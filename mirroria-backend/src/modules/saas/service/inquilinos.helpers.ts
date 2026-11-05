import type { InquilinoResumenDto } from '../dto/inquilino.dto.js';
import type { MarcaPublicaDto } from '../dto/marca.dto.js';
import type { UsoPlanDto } from '../dto/suscripcion.dto.js';
import type { TiendaPublicaDto } from '../dto/tienda-publica.dto.js';
import { EstadoInquilino, type Inquilino } from '../entities/inquilino.entity.js';
import { EstadoSuscripcion, type Suscripcion } from '../entities/suscripcion.entity.js';
import { type DatosMarca, marcaEfectiva, marcaInicial, type NivelMarca } from '../marca/marca-reglas.js';
import { diasRestantes } from '../saas-reglas.js';
import { aMini } from './marca.service.js';
import { estadoEfectivo } from './suscripciones.service.js';

/** Funciones puras de InquilinosService: disponibilidad, MRR, orden y fila del listado de la plataforma. */
const USO_VACIO: UsoPlanDto = { sucursales: 0, productos: 0, usuariosStaff: 0 };

export const nivelDe = (s: Suscripcion | undefined): NivelMarca => s?.plan?.nivelMarca ?? 'ESENCIAL';

export function tiendaADto(i: Inquilino, ultima: Suscripcion | undefined, marca: MarcaPublicaDto): TiendaPublicaDto {
  return { id: i.id, slug: i.slug, nombre: i.nombre, disponible: estaDisponible(i, ultima), marca };
}

export function estaDisponible(i: Inquilino, ultima: Suscripcion | undefined): boolean {
  if (i.estado !== EstadoInquilino.ACTIVO || !ultima) return false;
  const estado = estadoEfectivo(ultima);
  return estado === EstadoSuscripcion.TRIAL || estado === EstadoSuscripcion.ACTIVA;
}

export function mrrDe(ultima: Suscripcion | undefined): number {
  return ultima && estadoEfectivo(ultima) === EstadoSuscripcion.ACTIVA ? ultima.precioCents : 0;
}

export const ORDENAR: Record<string, (a: InquilinoResumenDto, b: InquilinoResumenDto) => number> = {
  recientes: (a, b) => b.createdAt.localeCompare(a.createdAt),
  'por-vencer': (a, b) => a.suscripcion.fin.localeCompare(b.suscripcion.fin),
  nombre: (a, b) => a.nombre.localeCompare(b.nombre, 'es'),
  mrr: (a, b) => b.mrrCents - a.mrrCents,
};

export function resumenDe(
  i: Inquilino,
  ultima: Suscripcion | undefined,
  uso: UsoPlanDto | undefined,
  contactos: Map<string, { fullName: string; email: string }>,
  guardada: DatosMarca | undefined,
): InquilinoResumenDto {
  return {
    id: i.id,
    nombre: i.nombre,
    slug: i.slug,
    estado: i.estado,
    disponible: estaDisponible(i, ultima),
    plan: { codigo: ultima?.plan.codigo ?? '', nombre: ultima?.plan.nombre ?? 'Sin plan' },
    suscripcion: {
      estado: ultima ? estadoEfectivo(ultima) : EstadoSuscripcion.VENCIDA,
      fin: ultima?.fin.toISOString() ?? i.createdAt.toISOString(),
      diasRestantes: ultima ? diasRestantes(ultima.fin) : 0,
    },
    propietario: (i.propietarioId && contactos.get(i.propietarioId)) || null,
    uso: uso ?? { ...USO_VACIO },
    createdAt: i.createdAt.toISOString(),
    marca: aMini(marcaEfectiva(guardada ?? marcaInicial(i.nombre), nivelDe(ultima))),
    mrrCents: mrrDe(ultima),
  };
}
