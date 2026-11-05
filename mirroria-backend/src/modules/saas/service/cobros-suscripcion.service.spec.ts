import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import type { DataSource, Repository } from 'typeorm';
import { RecursoNoEncontradoException } from '../../../core/exception/recurso-no-encontrado.exception.js';
import { PasarelaNoConfiguradaException } from '../../pagos/exception/pasarela-no-configurada.exception.js';
import type { RegistroPasarelasService } from '../../pagos/service/pasarela/registro-pasarelas.service.js';
import { CobroSuscripcion } from '../entities/cobro-suscripcion.entity.js';
import type { InquilinosService } from './inquilinos.service.js';
import type { PlanesService } from './planes.service.js';
import type { SuscripcionesService } from './suscripciones.service.js';
import { CobrosSuscripcionService } from './cobros-suscripcion.service.js';

describe('CobrosSuscripcionService', () => {
  let repo: Record<string, ReturnType<typeof vi.fn>>;
  let dataSource: { transaction: ReturnType<typeof vi.fn> };
  let inquilinos: { detalle: ReturnType<typeof vi.fn> };
  let planes: { porCodigo: ReturnType<typeof vi.fn> };
  let suscripciones: { ultima: ReturnType<typeof vi.fn>; activarPorPago: ReturnType<typeof vi.fn> };
  let registroPasarelas: { asegurarDisponible: ReturnType<typeof vi.fn> };
  let config: { get: ReturnType<typeof vi.fn> };
  let service: CobrosSuscripcionService;

  const INQUILINO = { id: 'inq-1', slug: 'boutique-luna', nombre: 'Boutique Luna', disponible: true };
  const PLAN_BASICO = { id: 'plan-1', codigo: 'basico', nombre: 'Básico', precioMensualCents: 9900 };
  const PLAN_PRO = { id: 'plan-2', codigo: 'profesional', nombre: 'Profesional', precioMensualCents: 19900 };

  beforeEach(() => {
    repo = {
      create: vi.fn((dto) => ({ ...dto, id: dto.id ?? 'cobro-uuid', createdAt: new Date(), updatedAt: new Date() })),
      save: vi.fn(async (ent) => ent),
      findOne: vi.fn().mockResolvedValue(null),
    };

    dataSource = {
      transaction: vi.fn(async (cb: (manager: any) => Promise<any>) => {
        const fakeManager = {
          getRepository: vi.fn().mockReturnValue(repo),
        };
        return cb(fakeManager);
      }),
    };

    inquilinos = {
      detalle: vi.fn().mockResolvedValue(INQUILINO),
    };

    planes = {
      porCodigo: vi.fn().mockResolvedValue(PLAN_PRO),
    };

    suscripciones = {
      ultima: vi.fn().mockResolvedValue({ plan: PLAN_BASICO }),
      activarPorPago: vi.fn().mockResolvedValue({ id: 'susc-activa' }),
    };

    registroPasarelas = {
      asegurarDisponible: vi.fn(),
    };

    config = {
      get: vi.fn((k: string) => {
        if (k === 'PAGOS_URL_EXITO') return 'http://localhost:5174/pago/exito';
        return undefined;
      }),
    };

    service = new CobrosSuscripcionService(
      repo as unknown as Repository<CobroSuscripcion>,
      dataSource as unknown as DataSource,
      inquilinos as unknown as InquilinosService,
      planes as unknown as PlanesService,
      suscripciones as unknown as SuscripcionesService,
      registroPasarelas as unknown as RegistroPasarelasService,
      config as unknown as ConfigService,
    );
  });

  describe('iniciarCobro', () => {
    it('inicia cobro con Wayra QR exitosamente', async () => {
      const mockWayra = {
        metadata: { tipo: 'QR', monedas: ['BOB'] },
        iniciarCobro: vi.fn().mockResolvedValue({
          modo: 'QR',
          qrBase64: 'data:image/png;base64,mockqr',
          qrTexto: 'http://localhost:5174/wayra/pagar/tok123',
          token: 'tok123',
          expiraEn: new Date(Date.now() + 900000),
        }),
      };
      registroPasarelas.asegurarDisponible.mockReturnValue(mockWayra);

      const res = await service.iniciarCobro('inq-1', { pasarela: 'WAYRA' });

      expect(registroPasarelas.asegurarDisponible).toHaveBeenCalledWith('WAYRA', 'suscripcion');
      expect(mockWayra.iniciarCobro).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalled();
      expect(res.modo).toBe('QR');
      expect(res.qrBase64).toBe('data:image/png;base64,mockqr');
      expect(res.token).toBe('tok123');
      expect(res.montoCents).toBe(9900);
    });

    it('inicia cobro con Stripe Checkout exitosamente', async () => {
      const mockStripe = {
        metadata: { tipo: 'TARJETA', monedas: ['USD', 'BOB'] },
        iniciarCobro: vi.fn().mockResolvedValue({
          modo: 'REDIRECT',
          url: 'https://checkout.stripe.com/c/pay/cs_test_123',
          token: 'cs_test_123',
        }),
      };
      registroPasarelas.asegurarDisponible.mockReturnValue(mockStripe);

      const res = await service.iniciarCobro('inq-1', { pasarela: 'STRIPE' });

      expect(res.modo).toBe('REDIRECT');
      expect(res.url).toBe('https://checkout.stripe.com/c/pay/cs_test_123');
      expect(repo.save).toHaveBeenCalled();
    });

    it('inicia cobro cambiando de plan en la misma solicitud (planCodigo)', async () => {
      const mockWayra = {
        metadata: { tipo: 'QR', monedas: ['BOB'] },
        iniciarCobro: vi.fn().mockResolvedValue({
          modo: 'QR',
          qrBase64: 'data:mock',
          token: 'tok_pro',
        }),
      };
      registroPasarelas.asegurarDisponible.mockReturnValue(mockWayra);

      const res = await service.iniciarCobro('inq-1', { pasarela: 'WAYRA', planCodigo: 'profesional' });

      expect(planes.porCodigo).toHaveBeenCalledWith('profesional', true);
      expect(res.montoCents).toBe(19900);
    });

    it('rechaza pasarela no disponible o en desarrollo', async () => {
      registroPasarelas.asegurarDisponible.mockImplementation(() => {
        throw new PasarelaNoConfiguradaException('La pasarela PayPal se encuentra en desarrollo.');
      });

      await expect(service.iniciarCobro('inq-1', { pasarela: 'PAYPAL' })).rejects.toThrow(
        PasarelaNoConfiguradaException,
      );
    });
  });

  describe('obtenerEstado', () => {
    it('devuelve estado del cobro si existe', async () => {
      const cobro = {
        id: 'cobro-1',
        inquilinoId: 'inq-1',
        estado: 'PENDIENTE',
        updatedAt: new Date(),
      };
      repo.findOne.mockResolvedValue(cobro);

      const res = await service.obtenerEstado('inq-1', 'cobro-1');
      expect(res.cobroId).toBe('cobro-1');
      expect(res.estado).toBe('PENDIENTE');
      expect(res.pagado).toBe(false);
    });

    it('informa pagado: true si estado es APROBADO', async () => {
      const cobro = {
        id: 'cobro-1',
        inquilinoId: 'inq-1',
        estado: 'APROBADO',
        updatedAt: new Date(),
      };
      repo.findOne.mockResolvedValue(cobro);

      const res = await service.obtenerEstado('inq-1', 'cobro-1');
      expect(res.pagado).toBe(true);
      expect(res.pagadoEn).toBeDefined();
    });

    it('lanza RecursoNoEncontradoException si cobro no existe', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.obtenerEstado('inq-1', 'inexistente')).rejects.toThrow(
        RecursoNoEncontradoException,
      );
    });
  });

  describe('Acreditación y webhooks', () => {
    it('acredita cobro por referencia de Stripe y llama a activarPorPago', async () => {
      const cobro = {
        id: 'cobro-1',
        inquilinoId: 'inq-1',
        proveedorPago: 'STRIPE',
        montoCents: 9900,
        estado: 'PENDIENTE',
        referenciaExterna: 'cs_test_999',
      };
      repo.findOne.mockResolvedValue(cobro);

      const ok = await service.acreditarPorReferencia('cs_test_999', 'evt_stripe_1');
      expect(ok).toBe(true);
      expect(cobro.estado).toBe('APROBADO');
      expect(suscripciones.activarPorPago).toHaveBeenCalledWith(
        'inq-1',
        { proveedor: 'STRIPE', referencia: 'cs_test_999', montoCents: 9900 },
        expect.anything(),
      );
    });

    it('idempotencia: reintento de Stripe no vuelve a activar', async () => {
      const cobroAprobado = {
        id: 'cobro-1',
        inquilinoId: 'inq-1',
        proveedorPago: 'STRIPE',
        montoCents: 9900,
        estado: 'APROBADO',
        referenciaExterna: 'cs_test_999',
      };
      repo.findOne.mockResolvedValue(cobroAprobado);

      const ok = await service.acreditarPorReferencia('cs_test_999', 'evt_stripe_1');
      expect(ok).toBe(true);
      expect(suscripciones.activarPorPago).not.toHaveBeenCalled();
    });

    it('acredita cobro por aviso Wayra QR', async () => {
      const cobro = {
        id: 'cobro-qr-1',
        inquilinoId: 'inq-1',
        proveedorPago: 'WAYRA',
        montoCents: 9900,
        estado: 'PENDIENTE',
        referenciaExterna: 'tok_wayra_1',
      };
      repo.findOne.mockResolvedValue(cobro);

      const aviso = {
        id: 'evt_w1',
        tipo: 'cobro_qr.pagado' as const,
        token: 'tok_wayra_1',
        transaccion: 'TRX-12345',
        montoCents: 9900,
        pagadoEn: new Date().toISOString(),
      };

      const ok = await service.acreditarPorAviso(aviso);
      expect(ok).toBe(true);
      expect(cobro.estado).toBe('APROBADO');
      expect(suscripciones.activarPorPago).toHaveBeenCalledWith(
        'inq-1',
        { proveedor: 'WAYRA', referencia: 'TRX-12345', montoCents: 9900 },
        expect.anything(),
      );
    });

    it('rechaza aviso Wayra si el monto no coincide', async () => {
      const cobro = {
        id: 'cobro-qr-1',
        inquilinoId: 'inq-1',
        proveedorPago: 'WAYRA',
        montoCents: 9900,
        estado: 'PENDIENTE',
        referenciaExterna: 'tok_wayra_1',
      };
      repo.findOne.mockResolvedValue(cobro);

      const aviso = {
        id: 'evt_w1',
        tipo: 'cobro_qr.pagado' as const,
        token: 'tok_wayra_1',
        transaccion: 'TRX-12345',
        montoCents: 5000, // No coincide con 9900
        pagadoEn: new Date().toISOString(),
      };

      const ok = await service.acreditarPorAviso(aviso);
      expect(ok).toBe(false);
      expect(suscripciones.activarPorPago).not.toHaveBeenCalled();
    });
  });

  describe('simularPago', () => {
    it('simula pago en desarrollo marcando APROBADO y activando suscripción', async () => {
      const cobro = {
        id: 'cobro-sim',
        inquilinoId: 'inq-1',
        proveedorPago: 'WAYRA',
        montoCents: 9900,
        estado: 'PENDIENTE',
        updatedAt: new Date(),
      };
      repo.findOne.mockResolvedValue(cobro);

      const res = await service.simularPago('inq-1', 'cobro-sim');
      expect(res.estado).toBe('APROBADO');
      expect(res.pagado).toBe(true);
      expect(suscripciones.activarPorPago).toHaveBeenCalledWith(
        'inq-1',
        expect.objectContaining({ proveedor: 'WAYRA', montoCents: 9900 }),
      );
    });
  });
});
