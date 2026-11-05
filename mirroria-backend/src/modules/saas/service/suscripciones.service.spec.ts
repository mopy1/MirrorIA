import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Repository } from 'typeorm';
import { EstadoSuscripcion, type Suscripcion } from '../entities/suscripcion.entity.js';
import { CambioPlanNoPermitidoException } from '../exception/cambio-plan-no-permitido.exception.js';
import { UsoSuperaPlanException } from '../exception/uso-supera-plan.exception.js';
import { MS_DIA } from '../saas-reglas.js';
import type { PlanesService } from './planes.service.js';
import type { ResolverTenantService } from './resolver-tenant.service.js';
import { estadoEfectivo, SuscripcionesService } from './suscripciones.service.js';
import type { UsoPlanService } from './uso-plan.service.js';

const BASICO = { id: 'p1', codigo: 'basico', nombre: 'Básico', precioMensualCents: 9900, maxSucursales: 1, maxProductos: 50, maxUsuariosStaff: 3 };
const CRECIMIENTO = { ...BASICO, id: 'p2', codigo: 'crecimiento', nombre: 'Crecimiento', precioMensualCents: 24900, maxSucursales: 3 };

function suscripcion(estado: EstadoSuscripcion, finEnDias: number, extra: Partial<Suscripcion> = {}): Suscripcion {
  return {
    id: 's1', estado, plan: BASICO, inquilino: { id: 'i1' }, inicio: new Date(),
    fin: new Date(Date.now() + finEnDias * MS_DIA), precioCents: 9900, proveedorPago: null, referenciaPago: null,
    ...extra,
  } as unknown as Suscripcion;
}

describe('SuscripcionesService', () => {
  let repo: Record<string, ReturnType<typeof vi.fn>>;
  let planes: { porCodigo: ReturnType<typeof vi.fn> };
  let uso: { calcular: ReturnType<typeof vi.fn> };
  let resolver: { invalidar: ReturnType<typeof vi.fn> };
  let service: SuscripcionesService;

  beforeEach(() => {
    repo = {
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue(null),
      save: vi.fn(async (x) => x),
      create: vi.fn((x) => x),
      update: vi.fn().mockResolvedValue({ affected: 2 }),
    };
    planes = { porCodigo: vi.fn().mockResolvedValue(CRECIMIENTO) };
    uso = { calcular: vi.fn().mockResolvedValue({ sucursales: 1, productos: 10, usuariosStaff: 1 }) };
    resolver = { invalidar: vi.fn() };
    service = new SuscripcionesService(
      repo as unknown as Repository<Suscripcion>,
      planes as unknown as PlanesService,
      uso as unknown as UsoPlanService,
      resolver as unknown as ResolverTenantService,
    );
  });

  it('una TRIAL con fin pasado se informa VENCIDA aunque la barrida no haya corrido', () => {
    expect(estadoEfectivo(suscripcion(EstadoSuscripcion.TRIAL, -1))).toBe(EstadoSuscripcion.VENCIDA);
    expect(estadoEfectivo(suscripcion(EstadoSuscripcion.TRIAL, 3))).toBe(EstadoSuscripcion.TRIAL);
  });

  it('la barrida pasa a VENCIDA las vigentes con fin < ahora e invalida la caché', async () => {
    expect(await service.vencerVencidas()).toBe(2);
    expect(repo.update.mock.calls[0][1]).toEqual({ estado: EstadoSuscripcion.VENCIDA });
    expect(resolver.invalidar).toHaveBeenCalled();
  });

  it('cambiar de plan desde la tienda solo en TRIAL (409 en ACTIVA)', async () => {
    repo.find.mockResolvedValue([suscripcion(EstadoSuscripcion.ACTIVA, 20)]);
    await expect(service.cambiarPlan('i1', 'crecimiento', true)).rejects.toThrow(CambioPlanNoPermitidoException);
  });

  it('en TRIAL cambia plan y precio congelado', async () => {
    const s = suscripcion(EstadoSuscripcion.TRIAL, 10);
    repo.find.mockResolvedValue([s]);
    await service.cambiarPlan('i1', 'crecimiento', true);
    expect(s.plan).toBe(CRECIMIENTO);
    expect(s.precioCents).toBe(24900);
    expect(resolver.invalidar).toHaveBeenCalledWith('i1');
  });

  it('bajar a un plan donde el uso actual no entra → 409', async () => {
    repo.find.mockResolvedValue([suscripcion(EstadoSuscripcion.TRIAL, 10, { plan: CRECIMIENTO } as Partial<Suscripcion>)]);
    planes.porCodigo.mockResolvedValue(BASICO);
    uso.calcular.mockResolvedValue({ sucursales: 2, productos: 10, usuariosStaff: 1 });
    await expect(service.cambiarPlan('i1', 'basico', true)).rejects.toThrow(UsoSuperaPlanException);
  });

  it('extender: vigente suma días; vencida sin pagos vuelve a TRIAL desde hoy', async () => {
    const vigente = suscripcion(EstadoSuscripcion.TRIAL, 2);
    const finAntes = vigente.fin.getTime();
    repo.find.mockResolvedValue([vigente]);
    await service.extender('i1', 5);
    expect(vigente.fin.getTime()).toBe(finAntes + 5 * MS_DIA);

    const vencida = suscripcion(EstadoSuscripcion.VENCIDA, -10);
    repo.find.mockResolvedValue([vencida]);
    await service.extender('i1', 5);
    expect(vencida.estado).toBe(EstadoSuscripcion.TRIAL);
    expect(Math.round((vencida.fin.getTime() - Date.now()) / MS_DIA)).toBe(5);
  });

  describe('activarPorPago (hook de la Fase 2)', () => {
    const pago = { proveedor: 'WAYRA', referencia: 'tx-1', montoCents: 9900 };

    it('TRIAL → ACTIVA por un mes desde hoy, con la referencia del pago', async () => {
      repo.findOne.mockResolvedValueOnce(suscripcion(EstadoSuscripcion.TRIAL, 3));
      const s = await service.activarPorPago('i1', pago);
      expect(s.estado).toBe(EstadoSuscripcion.ACTIVA);
      expect(s.referenciaPago).toBe('tx-1');
      expect(Math.round((s.fin.getTime() - Date.now()) / MS_DIA)).toBeGreaterThanOrEqual(28);
    });

    it('ACTIVA → fin += 1 mes', async () => {
      const activa = suscripcion(EstadoSuscripcion.ACTIVA, 10);
      const fin = new Date(activa.fin);
      repo.findOne.mockResolvedValueOnce(activa);
      const s = await service.activarPorPago('i1', pago);
      const esperado = new Date(fin);
      esperado.setMonth(esperado.getMonth() + 1);
      expect(s.fin.getTime()).toBe(esperado.getTime());
    });

    it('sin vigente (VENCIDA) → fila ACTIVA nueva con el plan de la última', async () => {
      repo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(suscripcion(EstadoSuscripcion.VENCIDA, -5));
      const s = await service.activarPorPago('i1', pago);
      expect(repo.create).toHaveBeenCalled();
      expect(s).toMatchObject({ estado: EstadoSuscripcion.ACTIVA, plan: BASICO, proveedorPago: 'WAYRA' });
      expect(resolver.invalidar).toHaveBeenCalledWith('i1');
    });
  });
});
