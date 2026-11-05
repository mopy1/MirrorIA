import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DataSource, EntityManager, Repository } from 'typeorm';
import { SolicitudInvalidaException } from '../../../core/exception/solicitud-invalida.exception.js';
import type { ActualizarMarcaDto } from '../dto/marca.dto.js';
import { Inquilino } from '../entities/inquilino.entity.js';
import { MarcaTienda } from '../entities/marca-tienda.entity.js';
import { MarcaFueraDelPlanException } from '../exception/marca-fuera-del-plan.exception.js';
import { type DatosMarca, marcaInicial, type NivelMarca } from '../marca/marca-reglas.js';
import type { EventosPlataformaService } from './eventos-plataforma.service.js';
import { aPublica, MarcaService } from './marca.service.js';
import type { ResolverTenantService } from './resolver-tenant.service.js';

const A = 'tenant-a';

function dtoDe(d: DatosMarca, nombre = 'Boutique Lila'): ActualizarMarcaDto {
  return { ...aPublica(d), nombre };
}

describe('MarcaService', () => {
  let filas: Map<string, DatosMarca>;
  let nivel: NivelMarca;
  let escrituras: Array<{ entidad: string; where: unknown; datos: unknown }>;
  let resolver: { porId: ReturnType<typeof vi.fn>; invalidar: ReturnType<typeof vi.fn> };
  let eventos: { registrar: ReturnType<typeof vi.fn> };
  let service: MarcaService;

  beforeEach(() => {
    filas = new Map([[A, marcaInicial('Boutique Lila')]]);
    nivel = 'ESENCIAL';
    escrituras = [];
    const repoMarca = {
      findOne: vi.fn(async ({ where }: { where: { inquilinoId: string } }) => {
        const d = filas.get(where.inquilinoId);
        return d ? { id: 'm1', inquilinoId: where.inquilinoId, ...d } : null;
      }),
      exists: vi.fn(async ({ where }: { where: { inquilinoId: string } }) => filas.has(where.inquilinoId)),
      update: vi.fn(async (where: { inquilinoId: string }, datos: DatosMarca) => {
        escrituras.push({ entidad: 'marca', where, datos });
        filas.set(where.inquilinoId, { ...filas.get(where.inquilinoId)!, ...datos });
      }),
      insert: vi.fn(),
    };
    const repoInquilino = {
      update: vi.fn(async (where: unknown, datos: unknown) => escrituras.push({ entidad: 'inquilino', where, datos })),
    };
    const manager = {
      getRepository: (e: unknown) => (e === MarcaTienda ? repoMarca : e === Inquilino ? repoInquilino : null),
    } as unknown as EntityManager;
    const dataSource = { transaction: vi.fn(async (fn: (m: EntityManager) => unknown) => fn(manager)) };
    resolver = {
      porId: vi.fn(async (id: string) => ({
        id, slug: 'lila', nombre: 'Boutique Lila', disponible: true, planNombre: nivel === 'ESENCIAL' ? 'Básico' : 'Cadena',
        limites: null, nivelMarca: nivel,
      })),
      invalidar: vi.fn(),
    };
    eventos = { registrar: vi.fn() };
    service = new MarcaService(
      repoMarca as unknown as Repository<MarcaTienda>,
      dataSource as unknown as DataSource,
      resolver as unknown as ResolverTenantService,
      eventos as unknown as EventosPlataformaService,
    );
  });

  it('guardar: actualiza la marca y inquilinos.nombre SOLO de su tienda, invalida el resolvedor y registra evento', async () => {
    const res = await service.guardar(A, dtoDe({ ...marcaInicial('x'), colorPrimario: '#9C3D24' }, 'Lila Boutique'), 'u1');
    expect(escrituras.map((e) => e.where)).toEqual([{ inquilinoId: A }, { id: A }]);
    expect(escrituras[1].datos).toEqual({ nombre: 'Lila Boutique' });
    expect(res.guardada.colorPrimario).toBe('#9C3D24');
    expect(resolver.invalidar).toHaveBeenCalledWith(A);
    expect(eventos.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ inquilinoId: A, tipo: 'MARCA_ACTUALIZADA', actorId: 'u1', actorRol: 'TIENDA' }), expect.anything());
  });

  it('contraste < 4.5:1 con el fondo del modo → 400 con el ratio, sin escribir', async () => {
    const p = service.guardar(A, dtoDe({ ...marcaInicial('x'), colorPrimario: '#F5D90A' }), 'u1');
    await expect(p).rejects.toThrow(SolicitudInvalidaException);
    await expect(service.guardar(A, dtoDe({ ...marcaInicial('x'), colorPrimario: '#F5D90A' }), 'u1'))
      .rejects.toThrow('El color principal #F5D90A tiene un contraste de 1.4:1 con el fondo claro; necesita 4.5:1');
    expect(escrituras).toEqual([]);
  });

  it('Básico: cambiar la fuente → 409 con "plan"; dejarla en el default → ok', async () => {
    await expect(service.guardar(A, dtoDe({ ...marcaInicial('x'), fuente: 'playfair' }), 'u1'))
      .rejects.toThrow(MarcaFueraDelPlanException);
    await expect(service.guardar(A, dtoDe({ ...marcaInicial('x'), fuente: 'playfair' }), 'u1'))
      .rejects.toThrow(/plan Básico no incluye cambiar la fuente/);
    await expect(service.guardar(A, dtoDe(marcaInicial('x')), 'u1')).resolves.toBeDefined();
  });

  it('bajar de plan conserva lo guardado y recorta lo efectivo', async () => {
    filas.set(A, { ...marcaInicial('Lila'), fuente: 'playfair', modo: 'OSCURO', colorPrimario: '#E3C14B', mostrarInsignia: false });
    nivel = 'ESENCIAL';
    const mi = await service.miMarca(A);
    expect(mi.guardada).toMatchObject({ fuente: 'playfair', modo: 'OSCURO', mostrarInsignia: false });
    expect(mi.efectiva).toMatchObject({ fuente: 'geist', modo: 'CLARO', mostrarInsignia: true });
    expect(mi.permitido.estilo).toBe(false);
  });

  it('restablecer COLORES vuelve a la paleta y deja evento con el motivo', async () => {
    filas.set(A, { ...marcaInicial('Lila', 'oliva'), colorPrimario: '#000000', eslogan: 'queda' });
    await service.restablecer(A, 'Lila', 'COLORES', { id: 'plat', rol: 'PLATAFORMA', motivo: 'colores ofensivos' });
    expect(filas.get(A)).toMatchObject({ colorPrimario: '#4B5B22', eslogan: 'queda', paleta: 'oliva' });
    expect(eventos.registrar).toHaveBeenCalledWith(expect.objectContaining({
      tipo: 'MARCA_RESTABLECIDA', detalle: 'Colores y estilo: colores ofensivos', actorRol: 'PLATAFORMA',
    }), expect.anything());
  });
});
