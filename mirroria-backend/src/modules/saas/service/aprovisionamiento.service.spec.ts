import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { DataSource, EntityManager } from 'typeorm';
import { tenantOpcional } from '../../../core/tenancy/tenant-context.js';
import type { CatalogoBaseService } from '../../catalogo/service/catalogo-base.service.js';
import type { ProveedoresService } from '../../proveedores/service/proveedores.service.js';
import type { AuthService } from '../../seguridad/service/auth.service.js';
import type { UsuariosService } from '../../seguridad/service/usuarios.service.js';
import type { SucursalesService } from '../../sucursales/service/sucursales.service.js';
import type { RegistrarTiendaDto } from '../dto/registrar-tienda.dto.js';
import { EstadoSuscripcion } from '../entities/suscripcion.entity.js';
import { SlugNoDisponibleException } from '../exception/slug-no-disponible.exception.js';
import { AprovisionamientoService } from './aprovisionamiento.service.js';
import type { EventosPlataformaService } from './eventos-plataforma.service.js';
import type { MarcaService } from './marca.service.js';
import type { PlanesService } from './planes.service.js';
import type { SuscripcionesService } from './suscripciones.service.js';

const PLAN = {
  id: 'plan-b', codigo: 'basico', nombre: 'Básico', precioMensualCents: 9900, diasPrueba: 14, nivelMarca: 'ESENCIAL',
  maxSucursales: 1, maxProductos: 50, maxUsuariosStaff: 3,
};

function dto(slug = 'boutique-lila'): RegistrarTiendaDto {
  return {
    planCodigo: 'basico',
    tienda: { nombre: 'Boutique Lila', slug },
    sucursal: { nombre: 'Central', direccion: 'Av. Siempre Viva 123', ciudadId: 'c1' },
    admin: { fullName: 'Lila', email: 'lila@x.com', password: '12345678' },
  };
}

describe('AprovisionamientoService', () => {
  const manager = { getRepository: () => ({ create: (x: object) => x, save: async (x: object) => ({ ...x }) }) } as unknown as EntityManager;
  let pasos: string[];
  let tenantsVistos: Array<string | null>;
  let deps: Record<string, Record<string, ReturnType<typeof vi.fn>>>;
  let service: AprovisionamientoService;

  beforeEach(() => {
    pasos = [];
    tenantsVistos = [];
    const paso = (nombre: string, valor: unknown) =>
      vi.fn(async (...args: unknown[]) => {
        pasos.push(nombre);
        tenantsVistos.push(tenantOpcional());
        expect(args).toContain(manager); // todos con el MISMO manager de la transacción
        return valor;
      });
    deps = {
      planes: { porCodigo: vi.fn().mockResolvedValue(PLAN) },
      suscripciones: {
        crearTrial: paso('suscripcion', {
          id: 's1', estado: EstadoSuscripcion.TRIAL, plan: PLAN, inicio: new Date(),
          fin: new Date(Date.now() + 14 * 86400000), precioCents: 9900, proveedorPago: null, referenciaPago: null,
        }),
      },
      usuarios: { crearAdminInicial: paso('admin', { id: 'u1', tenantId: 'x' }) },
      sucursales: { crearInicial: paso('sucursal', { id: 'suc1' }) },
      proveedores: { crearPropio: paso('proveedor', { id: 'prov1' }) },
      catalogo: { sembrarBase: paso('catalogo', undefined) },
      marcas: { crearInicial: paso('marca', undefined) },
      eventos: { registrar: paso('evento', undefined) },
      auth: { emitirToken: vi.fn().mockReturnValue({ accessToken: 'jwt', usuario: { id: 'u1' } }) },
    };
    const dataSource = { transaction: vi.fn(async (fn: (m: EntityManager) => unknown) => fn(manager)) };
    service = new AprovisionamientoService(
      dataSource as unknown as DataSource,
      deps.planes as unknown as PlanesService,
      deps.suscripciones as unknown as SuscripcionesService,
      deps.usuarios as unknown as UsuariosService,
      deps.auth as unknown as AuthService,
      deps.sucursales as unknown as SucursalesService,
      deps.proveedores as unknown as ProveedoresService,
      deps.catalogo as unknown as CatalogoBaseService,
      deps.marcas as unknown as MarcaService,
      deps.eventos as unknown as EventosPlataformaService,
    );
  });

  it('llama a los 5 servicios con el mismo manager, dentro del contexto de la tienda NUEVA', async () => {
    const res = await service.registrar(dto());
    expect(pasos).toEqual(['suscripcion', 'admin', 'sucursal', 'proveedor', 'catalogo', 'marca', 'evento']);
    const nuevo = res.tienda.id;
    expect(tenantsVistos.every((t) => t === nuevo)).toBe(true);
    expect(res).toMatchObject({
      accessToken: 'jwt', sucursalId: 'suc1',
      tienda: { slug: 'boutique-lila', disponible: true },
      suscripcion: { estado: 'TRIAL', diasRestantes: 14 },
    });
    expect(deps.catalogo.sembrarBase).toHaveBeenCalledWith(manager, { proveedorId: 'prov1' });
    expect(deps.eventos.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ inquilinoId: nuevo, tipo: 'ALTA', actorRol: 'TIENDA' }), manager);
  });

  it('defaults de marca: sin paleta nace grafito; con paleta, sus colores (y la marca va en la respuesta)', async () => {
    const res = await service.registrar(dto());
    expect(deps.marcas.crearInicial).toHaveBeenCalledWith(manager, res.tienda.id, 'Boutique Lila', undefined);
    expect(res.tienda.marca).toMatchObject({
      colorPrimario: '#26282E', modo: 'CLARO', fuente: 'geist', mostrarInsignia: true,
      hero: { titulo: 'Bienvenida a Boutique Lila', ctaDestino: 'CATALOGO' },
    });
    const conPaleta = dto('boutique-mar');
    conPaleta.tienda.paleta = 'oceano';
    const res2 = await service.registrar(conPaleta);
    expect(deps.marcas.crearInicial).toHaveBeenLastCalledWith(manager, res2.tienda.id, 'Boutique Lila', 'oceano');
    expect(res2.tienda.marca.colorPrimario).toBe('#0E4D74');
  });

  it('un error en un paso intermedio (sucursal) se propaga y no sigue: la transacción revierte todo', async () => {
    deps.sucursales.crearInicial.mockRejectedValueOnce(new Error('ciudad inexistente'));
    await expect(service.registrar(dto())).rejects.toThrow('ciudad inexistente');
    expect(deps.proveedores.crearPropio).not.toHaveBeenCalled();
    expect(deps.auth.emitirToken).not.toHaveBeenCalled();
  });

  it('un slug reservado es 409 antes de tocar la base', async () => {
    await expect(service.registrar(dto('plataforma'))).rejects.toThrow(SlugNoDisponibleException);
    expect(pasos).toEqual([]);
  });
});
