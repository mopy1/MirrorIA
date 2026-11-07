import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import type { DataSource, Repository } from 'typeorm';
import { ForbiddenActionException } from '../../../core/exception/forbidden-action.exception.js';
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
  let suscripciones: {
    ultima: ReturnType<typeof vi.fn>;
    activarPorPago: ReturnType<typeof vi.fn>;
    asegurarUsoEnPlan: ReturnType<typeof vi.fn>;
  };
  let registroPasarelas: { asegurarDisponible: ReturnType<typeof vi.fn>; obtener: ReturnType<typeof vi.fn> };
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
      update: vi.fn().mockResolvedValue({ affected: 1 }),
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
      asegurarUsoEnPlan: vi.fn().mockResolvedValue(undefined),
    };

    registroPasarelas = {
      asegurarDisponible: vi.fn(),
      obtener: vi.fn(),
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
        expect.anything(),
      );
    });

    const pendiente = (proveedorPago: string) => ({
      id: 'cobro-sim', inquilinoId: 'inq-1', proveedorPago, montoCents: 9900, estado: 'PENDIENTE', updatedAt: new Date(),
    });

    it('en produccion no existe: nadie activa una tienda sin pagar', async () => {
      config.get.mockImplementation((k: string) => (k === 'NODE_ENV' ? 'production' : undefined));
      repo.findOne.mockResolvedValue(pendiente('WAYRA'));

      await expect(service.simularPago('inq-1', 'cobro-sim')).rejects.toThrow(ForbiddenActionException);
      expect(suscripciones.activarPorPago).not.toHaveBeenCalled();
    });

    it('una pasarela real no se simula, ni en desarrollo', async () => {
      repo.findOne.mockResolvedValue(pendiente('STRIPE'));
      await expect(service.simularPago('inq-1', 'cobro-sim')).rejects.toThrow(ForbiddenActionException);
      repo.findOne.mockResolvedValue(pendiente('PAYPAL'));
      await expect(service.simularPago('inq-1', 'cobro-sim')).rejects.toThrow(ForbiddenActionException);
      expect(suscripciones.activarPorPago).not.toHaveBeenCalled();
    });

    it('dos clics a la vez acreditan un solo mes', async () => {
      repo.findOne.mockImplementation(async () => pendiente('WAYRA'));
      repo.update.mockResolvedValueOnce({ affected: 1 }).mockResolvedValueOnce({ affected: 0 });

      await Promise.all([service.simularPago('inq-1', 'cobro-sim'), service.simularPago('inq-1', 'cobro-sim')]);

      expect(suscripciones.activarPorPago).toHaveBeenCalledTimes(1);
    });
  });

  describe('El plan que se paga', () => {
    it('acredita con el plan del cobro, no con el que tenia la tienda', async () => {
      repo.findOne.mockResolvedValue({
        id: 'c1', inquilinoId: 'inq-1', planId: 'plan-2', proveedorPago: 'STRIPE', montoCents: 19900,
        estado: 'PENDIENTE', referenciaExterna: 'cs_1',
      });

      await service.acreditarPorReferencia('cs_1', 'evt_1');

      expect(suscripciones.activarPorPago).toHaveBeenCalledWith(
        'inq-1',
        expect.objectContaining({ planId: 'plan-2' }),
        expect.anything(),
      );
    });

    it('no deja pagar un plan que no alcanza para lo que la tienda usa', async () => {
      suscripciones.asegurarUsoEnPlan.mockRejectedValue(new Error('uso supera el plan'));
      const iniciar = vi.fn();
      registroPasarelas.asegurarDisponible.mockReturnValue({
        metadata: { tipo: 'QR', monedas: ['BOB'] },
        iniciarCobro: iniciar,
      });

      await expect(
        service.iniciarCobro('inq-1', { pasarela: 'WAYRA', planCodigo: 'profesional' }),
      ).rejects.toThrow('uso supera el plan');
      expect(iniciar).not.toHaveBeenCalled();
    });
  });

  describe('Confirmar con la pasarela (Stripe y PayPal)', () => {
    const cobroPendiente = (extra: Record<string, unknown> = {}) => ({
      id: 'cobro-1',
      inquilinoId: 'inq-1',
      proveedorPago: 'PAYPAL',
      montoCents: 9900,
      estado: 'PENDIENTE',
      referenciaExterna: 'ORDEN-1',
      updatedAt: new Date(),
      metadata: { montoPasarelaCents: 1500, monedaPasarela: 'USD' },
      ...extra,
    });
    const confirmarCobro = vi.fn();
    const verificarNotificacion = vi.fn();

    beforeEach(() => {
      confirmarCobro.mockReset();
      verificarNotificacion.mockReset();
      registroPasarelas.obtener.mockReturnValue({ confirmarCobro, verificarNotificacion });
    });

    it('guarda lo que la pasarela cobra de verdad y le pasa el precio USD del plan', async () => {
      planes.porCodigo.mockResolvedValue({ ...PLAN_PRO, precioMensualUsdCents: 2900 });
      const iniciar = vi.fn().mockResolvedValue({
        modo: 'REDIRECT',
        url: 'https://paypal/x',
        token: 'ORDEN-1',
        montoCobrado: { cents: 2900, moneda: 'USD' },
      });
      registroPasarelas.asegurarDisponible.mockReturnValue({
        metadata: { tipo: 'BILLETERA', monedas: ['USD'] },
        iniciarCobro: iniciar,
      });

      await service.iniciarCobro('inq-1', { pasarela: 'PAYPAL', planCodigo: 'profesional' });

      expect(iniciar.mock.calls[0][0]).toMatchObject({ montoCents: 19900, montoUsdCents: 2900 });
      expect(repo.create.mock.calls[0][0].metadata).toMatchObject({
        montoPasarelaCents: 2900,
        monedaPasarela: 'USD',
      });
    });

    it('acredita cuando la pasarela confirma el cobro y el monto coincide', async () => {
      repo.findOne.mockResolvedValue(cobroPendiente());
      confirmarCobro.mockResolvedValue({ estado: 'APROBADO', transaccion: 'CAP-1', montoCents: 1500 });

      await service.confirmarRegreso('inq-1', 'cobro-1');

      expect(confirmarCobro).toHaveBeenCalledWith('ORDEN-1');
      expect(suscripciones.activarPorPago).toHaveBeenCalledWith(
        'inq-1',
        { proveedor: 'PAYPAL', referencia: 'CAP-1', montoCents: 9900 },
        expect.anything(),
      );
    });

    it('volver a la URL de exito sin haber pagado no activa nada', async () => {
      repo.findOne.mockResolvedValue(cobroPendiente());
      confirmarCobro.mockResolvedValue({ estado: 'PENDIENTE' });

      const r = await service.confirmarRegreso('inq-1', 'cobro-1');

      expect(r.pagado).toBe(false);
      expect(suscripciones.activarPorPago).not.toHaveBeenCalled();
    });

    it('un monto distinto al esperado no acredita', async () => {
      repo.findOne.mockResolvedValue(cobroPendiente());
      confirmarCobro.mockResolvedValue({ estado: 'APROBADO', transaccion: 'CAP-1', montoCents: 1 });

      await service.confirmarRegreso('inq-1', 'cobro-1');

      expect(suscripciones.activarPorPago).not.toHaveBeenCalled();
    });

    it('un cobro rechazado por la pasarela queda RECHAZADO', async () => {
      repo.findOne.mockResolvedValue(cobroPendiente());
      confirmarCobro.mockResolvedValue({ estado: 'RECHAZADO' });

      await service.confirmarRegreso('inq-1', 'cobro-1');

      expect(repo.update).toHaveBeenCalledWith(
        { id: 'cobro-1', estado: 'PENDIENTE' },
        { estado: 'RECHAZADO' },
      );
      expect(suscripciones.activarPorPago).not.toHaveBeenCalled();
    });

    it('un cobro ya aprobado no vuelve a preguntar ni a acreditar', async () => {
      repo.findOne.mockResolvedValue(cobroPendiente({ estado: 'APROBADO' }));

      const r = await service.confirmarRegreso('inq-1', 'cobro-1');

      expect(r.pagado).toBe(true);
      expect(confirmarCobro).not.toHaveBeenCalled();
    });

    it('el cobro de otra tienda da 404', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.confirmarRegreso('inq-2', 'cobro-1')).rejects.toThrow(
        RecursoNoEncontradoException,
      );
    });

    it('regreso y webhook a la vez: solo uno acredita el mes', async () => {
      repo.findOne.mockResolvedValue(cobroPendiente());
      confirmarCobro.mockResolvedValue({ estado: 'APROBADO', transaccion: 'CAP-1', montoCents: 1500 });
      repo.update.mockResolvedValueOnce({ affected: 1 }).mockResolvedValueOnce({ affected: 0 });

      await Promise.all([
        service.confirmarRegreso('inq-1', 'cobro-1'),
        service.confirmarRegreso('inq-1', 'cobro-1'),
      ]);

      expect(suscripciones.activarPorPago).toHaveBeenCalledTimes(1);
    });

    it('aviso de PayPal verificado: captura y acredita', async () => {
      verificarNotificacion.mockResolvedValue({
        id: 'WH-1', tipo: 'PAGO_APROBADO', referenciaExterna: 'ORDEN-1',
      });
      repo.findOne.mockResolvedValue(cobroPendiente());
      confirmarCobro.mockResolvedValue({ estado: 'APROBADO', transaccion: 'CAP-1', montoCents: 1500 });

      const r = await service.procesarAvisoPaypal(Buffer.from('{}'), {});

      expect(r).toEqual({ procesado: true });
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { referenciaExterna: 'ORDEN-1', proveedorPago: 'PAYPAL' },
      });
      expect(suscripciones.activarPorPago).toHaveBeenCalledTimes(1);
    });

    it('aviso de otro tipo o de una orden desconocida no acredita', async () => {
      verificarNotificacion.mockResolvedValue({ id: 'WH-1', tipo: 'OTRO', referenciaExterna: 'X' });
      await expect(service.procesarAvisoPaypal(Buffer.from('{}'), {})).resolves.toEqual({ procesado: false });

      verificarNotificacion.mockResolvedValue({ id: 'WH-2', tipo: 'PAGO_APROBADO', referenciaExterna: 'X' });
      repo.findOne.mockResolvedValue(null);
      await expect(service.procesarAvisoPaypal(Buffer.from('{}'), {})).resolves.toEqual({ procesado: false });

      expect(suscripciones.activarPorPago).not.toHaveBeenCalled();
    });

    it('avisos repetidos de Wayra a la vez acreditan un solo mes', async () => {
      const cobro = cobroPendiente({ proveedorPago: 'WAYRA', referenciaExterna: 'tok' });
      repo.findOne.mockResolvedValue(cobro);
      repo.update.mockResolvedValueOnce({ affected: 1 }).mockResolvedValue({ affected: 0 });
      const aviso = { id: 'a', tipo: 'cobro_qr.pagado', token: 'tok', transaccion: 't', montoCents: 9900 };

      await Promise.all([1, 2, 3].map(() => service.acreditarPorAviso(aviso as never)));

      expect(suscripciones.activarPorPago).toHaveBeenCalledTimes(1);
    });
  });
});
