import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { DataSource } from 'typeorm';
import type { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PagosService } from './pagos.service.js';
import { EstadoPago, MetodoPago, Pago, ProveedorPago } from '../entities/pago.entity.js';
import { VentaNoPagableException } from '../exception/venta-no-pagable.exception.js';
import { PasarelaNoConfiguradaException } from '../exception/pasarela-no-configurada.exception.js';
import { FirmaWebhookInvalidaException } from '../exception/firma-webhook-invalida.exception.js';
import type { VentasService } from '../../ventas/service/ventas.service.js';
import type { ExpiracionService } from './expiracion.service.js';
import type { Pasarela } from './pasarela/pasarela.interface.js';

const DUENO = { sub: 'cli1', email: 'a@a.com', role: 'CUSTOMER', sucursalId: null };
const CAJERO = { sub: 'caj1', email: 'b@b.com', role: 'CAJERO', sucursalId: 's1' };

describe('PagosService — cobro manual', () => {
  let pagoRepo: Record<string, ReturnType<typeof vi.fn>>;
  let ventas: { findOne: ReturnType<typeof vi.fn>; marcarPagada: ReturnType<typeof vi.fn> };
  let expiracion: { expirarVencidas: ReturnType<typeof vi.fn> };
  let pasarela: {
    estaConfigurada: ReturnType<typeof vi.fn>;
    crearSesion: ReturnType<typeof vi.fn>;
    verificarEvento: ReturnType<typeof vi.fn>;
  };
  let service: PagosService;

  beforeEach(() => {
    pagoRepo = {
      create: vi.fn((e) => e),
      save: vi.fn((e) => Promise.resolve({ id: 'p1', ...e })),
      findOne: vi.fn(),
      find: vi.fn().mockResolvedValue([]),
    };
    ventas = {
      findOne: vi.fn().mockResolvedValue({
        id: 'v1', clienteId: 'cli1', estado: 'PENDIENTE', totalCents: 25000,
      }),
      marcarPagada: vi.fn(),
    };
    const config = { get: vi.fn().mockReturnValue('https://ejemplo/qr.png') } as unknown as ConfigService;
    // La confirmacion corre dentro de una transaccion: el manager que le llega
    // al callback expone el mismo repo de pagos que usamos afuera, para que
    // las aserciones sobre pagoRepo.save sigan valiendo.
    const manager = { getRepository: () => pagoRepo };
    const dataSource = {
      transaction: (cb: (m: unknown) => unknown) => cb(manager),
    } as unknown as DataSource;
    expiracion = { expirarVencidas: vi.fn().mockResolvedValue(0) };
    pasarela = {
      estaConfigurada: vi.fn().mockReturnValue(true),
      crearSesion: vi.fn(),
      verificarEvento: vi.fn(),
    };
    service = new PagosService(
      pagoRepo as unknown as Repository<Pago>,
      dataSource,
      ventas as unknown as VentasService,
      config,
      expiracion as unknown as ExpiracionService,
      pasarela as unknown as Pasarela,
    );
  });

  it('iniciar un cobro libera antes el stock de las compras vencidas', async () => {
    // Sin planificador, esta llamada ES el mecanismo de liberacion: si se borra,
    // el inventario vuelve a retenerse para siempre y nada mas lo notaria.
    await service.iniciarManual('v1', { metodo: MetodoPago.QR }, DUENO);
    expect(expiracion.expirarVencidas).toHaveBeenCalled();
  });

  it('confirmar un cobro tambien dispara la liberacion', async () => {
    pagoRepo.findOne.mockResolvedValue({
      id: 'p1', ventaId: 'v1', estado: EstadoPago.PENDIENTE, metodo: MetodoPago.QR,
    });
    await service.confirmarManual('p1', CAJERO);
    expect(expiracion.expirarVencidas).toHaveBeenCalled();
  });

  it('iniciar un cobro por QR crea un pago PENDIENTE por el total de la venta', async () => {
    const res = await service.iniciarManual('v1', { metodo: MetodoPago.QR }, DUENO);
    expect(pagoRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        ventaId: 'v1',
        montoCents: 25000,
        metodo: MetodoPago.QR,
        proveedorPago: ProveedorPago.MANUAL,
        estado: EstadoPago.PENDIENTE,
      }),
    );
    expect(res.montoCents).toBe(25000);
  });

  it('el pago manual lleva un event_id propio, que es donde vive la unicidad', async () => {
    await service.iniciarManual('v1', { metodo: MetodoPago.EFECTIVO }, DUENO);
    const guardado = pagoRepo.save.mock.calls[0][0] as { eventId: string };
    expect(guardado.eventId).toMatch(/^manual:/);
  });

  it('por QR devuelve la imagen configurada; por efectivo no', async () => {
    const qr = await service.iniciarManual('v1', { metodo: MetodoPago.QR }, DUENO);
    expect(qr.qrUrl).toBe('https://ejemplo/qr.png');

    const efectivo = await service.iniciarManual('v1', { metodo: MetodoPago.EFECTIVO }, DUENO);
    expect(efectivo.qrUrl).toBeNull();
  });

  it('nadie puede iniciar el pago de una venta ajena', async () => {
    ventas.findOne.mockResolvedValue({ id: 'v1', clienteId: 'OTRO', estado: 'PENDIENTE', totalCents: 100 });
    await expect(
      service.iniciarManual('v1', { metodo: MetodoPago.QR }, DUENO),
    ).rejects.toThrow();
    expect(pagoRepo.save).not.toHaveBeenCalled();
  });

  it('una venta que no esta PENDIENTE no se puede pagar', async () => {
    ventas.findOne.mockResolvedValue({ id: 'v1', clienteId: 'cli1', estado: 'CANCELADA', totalCents: 100 });
    await expect(
      service.iniciarManual('v1', { metodo: MetodoPago.QR }, DUENO),
    ).rejects.toThrow(VentaNoPagableException);
  });

  it('confirmar aprueba el pago y cobra la venta', async () => {
    pagoRepo.findOne.mockResolvedValue({
      id: 'p1', ventaId: 'v1', estado: EstadoPago.PENDIENTE, metodo: MetodoPago.QR,
    });
    await service.confirmarManual('p1', CAJERO);
    // El segundo argumento es el EntityManager de la transaccion (ver
    // "si la venta ya no se puede cobrar..." mas abajo): mismo manager con el
    // que se guardo el pago, para que las dos escrituras vivan o mueran juntas.
    expect(ventas.marcarPagada).toHaveBeenCalledWith('v1', expect.anything());
    expect(pagoRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ estado: EstadoPago.APROBADO }),
    );
  });

  it('confirmar deja registro de QUIEN confirmo', async () => {
    pagoRepo.findOne.mockResolvedValue({
      id: 'p1', ventaId: 'v1', estado: EstadoPago.PENDIENTE, metodo: MetodoPago.QR,
    });
    await service.confirmarManual('p1', CAJERO);
    const guardado = pagoRepo.save.mock.calls[0][0] as { referenciaExterna: string };
    expect(guardado.referenciaExterna).toContain('caj1');
  });

  it('confirmar dos veces el mismo pago no cobra dos veces', async () => {
    pagoRepo.findOne.mockResolvedValue({
      id: 'p1', ventaId: 'v1', estado: EstadoPago.APROBADO, metodo: MetodoPago.QR,
    });
    await service.confirmarManual('p1', CAJERO);
    expect(ventas.marcarPagada).not.toHaveBeenCalled();
  });

  it('un pago de tarjeta NO se puede confirmar a mano: lo decide el webhook', async () => {
    pagoRepo.findOne.mockResolvedValue({
      id: 'p1', ventaId: 'v1', estado: EstadoPago.PENDIENTE, metodo: MetodoPago.TARJETA,
    });
    await expect(service.confirmarManual('p1', CAJERO)).rejects.toThrow();
    expect(ventas.marcarPagada).not.toHaveBeenCalled();
  });

  it('si la venta ya no se puede cobrar, el pago NO queda aprobado', async () => {
    // Pasa de verdad: la expiracion cancela una venta vencida mientras el cajero
    // tiene la pantalla abierta. Un cobro aprobado sobre una venta cancelada
    // cuyo stock ya volvio seria plata que el sistema dice haber recibido.
    pagoRepo.findOne.mockResolvedValue({
      id: 'p1', ventaId: 'v1', estado: EstadoPago.PENDIENTE, metodo: MetodoPago.QR,
    });
    ventas.marcarPagada.mockRejectedValue(new Error('la venta esta CANCELADA'));

    await expect(service.confirmarManual('p1', CAJERO)).rejects.toThrow();
  });

  it('dos cobros manuales generan event_id distintos', async () => {
    await service.iniciarManual('v1', { metodo: MetodoPago.QR }, DUENO);
    await service.iniciarManual('v1', { metodo: MetodoPago.QR }, DUENO);
    const [primero, segundo] = pagoRepo.save.mock.calls.map((c) => (c[0] as { eventId: string }).eventId);
    expect(primero).not.toBe(segundo);
  });

  describe('reutilizacion de un pago manual pendiente (no duplicar por refresh)', () => {
    it('dos llamadas seguidas sobre la misma venta dejan una sola fila: la segunda reutiliza la existente', async () => {
      // Primera llamada: no hay ningun pago pendiente todavia.
      // Segunda llamada: ya existe la fila que creo la primera.
      pagoRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'p1', ventaId: 'v1', metodo: MetodoPago.QR,
          estado: EstadoPago.PENDIENTE, proveedorPago: ProveedorPago.MANUAL,
          eventId: 'manual:existente',
        });

      const primera = await service.iniciarManual('v1', { metodo: MetodoPago.QR }, DUENO);
      const segunda = await service.iniciarManual('v1', { metodo: MetodoPago.QR }, DUENO);

      expect(segunda.pagoId).toBe(primera.pagoId);
      // La primera llamada crea (entidad sin id todavia); la segunda guarda
      // la fila YA existente (con su id), no una entidad nueva.
      expect(pagoRepo.save.mock.calls[0][0]).not.toHaveProperty('id');
      expect(pagoRepo.save.mock.calls[1][0]).toMatchObject({ id: 'p1' });
    });

    it('si la clienta cambia de metodo (QR a efectivo), se actualiza la fila existente en vez de crear otra', async () => {
      pagoRepo.findOne.mockResolvedValue({
        id: 'p1', ventaId: 'v1', metodo: MetodoPago.QR,
        estado: EstadoPago.PENDIENTE, proveedorPago: ProveedorPago.MANUAL,
        eventId: 'manual:existente',
      });

      const res = await service.iniciarManual('v1', { metodo: MetodoPago.EFECTIVO }, DUENO);

      expect(res.pagoId).toBe('p1');
      expect(pagoRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'p1', metodo: MetodoPago.EFECTIVO }),
      );
    });

    it('si no hay ningun pago pendiente para la venta, se crea uno nuevo', async () => {
      pagoRepo.findOne.mockResolvedValue(null);

      await service.iniciarManual('v1', { metodo: MetodoPago.QR }, DUENO);

      expect(pagoRepo.save.mock.calls[0][0]).not.toHaveProperty('id');
      expect(pagoRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ ventaId: 'v1', estado: EstadoPago.PENDIENTE }),
      );
    });
  });

  describe('cobro con tarjeta', () => {
    it('sin pasarela configurada devuelve 503 y NO crea ningun pago', async () => {
      pasarela.estaConfigurada.mockReturnValue(false);
      await expect(service.iniciarTarjeta('v1', DUENO)).rejects.toThrow(
        PasarelaNoConfiguradaException,
      );
      expect(pagoRepo.save).not.toHaveBeenCalled();
      expect(ventas.findOne).not.toHaveBeenCalled();
    });

    it('iniciar un cobro con tarjeta tambien libera el stock vencido', async () => {
      // La spec (3.6) nombra tres disparadores y este es uno. Sin planificador,
      // estas llamadas SON el mecanismo: la tarjeta es el canal digital mas
      // usado, asi que no engancharla dejaria el stock retenido por el camino
      // principal, que es justo lo que el diseño dice resolver.
      pasarela.crearSesion.mockResolvedValue({ id: 'ses_1', url: 'https://pasarela/pagar' });
      await service.iniciarTarjeta('v1', DUENO);
      expect(expiracion.expirarVencidas).toHaveBeenCalled();
    });

    it('crea el pago en PENDIENTE y devuelve la url de la pasarela', async () => {
      pasarela.crearSesion.mockResolvedValue({ id: 'ses_1', url: 'https://pasarela/pagar' });
      const res = await service.iniciarTarjeta('v1', DUENO);
      expect(res.url).toBe('https://pasarela/pagar');
      expect(pagoRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          metodo: MetodoPago.TARJETA,
          proveedorPago: ProveedorPago.STRIPE,
          estado: EstadoPago.PENDIENTE,
          referenciaExterna: 'ses_1',
        }),
      );
    });

    it('el event_id del pago referencia la sesion, no el evento del webhook', async () => {
      // El evento real llega despues; hasta entonces la unicidad la da la sesion.
      pasarela.crearSesion.mockResolvedValue({ id: 'ses_1', url: 'https://x' });
      await service.iniciarTarjeta('v1', DUENO);
      const guardado = pagoRepo.save.mock.calls[0][0] as { eventId: string };
      expect(guardado.eventId).toBe('sesion:ses_1');
    });

    it('nadie puede iniciar el cobro de una venta ajena', async () => {
      ventas.findOne.mockResolvedValue({ id: 'v1', clienteId: 'OTRO', estado: 'PENDIENTE', totalCents: 1 });
      await expect(service.iniciarTarjeta('v1', DUENO)).rejects.toThrow();
    });

    it('la URL de exito (y la de cancelacion) que recibe la pasarela llevan el id de la venta', async () => {
      // Sin esto, la pantalla de regreso no sabe que venta consultar y hoy
      // depende solo de sessionStorage, que falla en otra pestaña, otro
      // dispositivo, o si se borraron datos de navegacion.
      pasarela.crearSesion.mockResolvedValue({ id: 'ses_1', url: 'https://pasarela/pagar' });
      await service.iniciarTarjeta('v1', DUENO);
      const args = pasarela.crearSesion.mock.calls[0][0] as {
        urlExito: string;
        urlCancelacion: string;
      };
      expect(args.urlExito).toContain('venta=v1');
      expect(args.urlCancelacion).toContain('venta=v1');
    });
  });

  describe('webhook', () => {
    const CUERPO = Buffer.from('{}');

    it('una firma invalida es 400 y no cambia NADA', async () => {
      pasarela.verificarEvento.mockImplementation(() => {
        throw new FirmaWebhookInvalidaException();
      });
      await expect(service.procesarEvento(CUERPO, 'mala')).rejects.toThrow(
        FirmaWebhookInvalidaException,
      );
      expect(ventas.marcarPagada).not.toHaveBeenCalled();
      expect(pagoRepo.save).not.toHaveBeenCalled();
    });

    it('un evento valido aprueba el pago y cobra la venta', async () => {
      pasarela.verificarEvento.mockReturnValue({ id: 'evt_1', tipo: 'pagado', sesionId: 'ses_1' });
      pagoRepo.findOne.mockResolvedValue({
        id: 'p1', ventaId: 'v1', estado: EstadoPago.PENDIENTE, metodo: MetodoPago.TARJETA,
      });
      const res = await service.procesarEvento(CUERPO, 'buena');
      expect(res.procesado).toBe(true);
      // Segundo argumento es el EntityManager de la transaccion (ver el caso
      // de la venta ya no pagable, mas abajo): mismo manager con el que se
      // guardo el pago, para que las dos escrituras vivan o mueran juntas.
      expect(ventas.marcarPagada).toHaveBeenCalledWith('v1', expect.anything());
    });

    it('EL MISMO evento entregado dos veces cobra UNA sola vez', async () => {
      // Stripe reintenta. Es la promesa explicita del documento entregado.
      pasarela.verificarEvento.mockReturnValue({ id: 'evt_1', tipo: 'pagado', sesionId: 'ses_1' });
      pagoRepo.findOne
        .mockResolvedValueOnce({ id: 'p1', ventaId: 'v1', estado: EstadoPago.PENDIENTE, metodo: MetodoPago.TARJETA })
        .mockResolvedValueOnce({ id: 'p1', ventaId: 'v1', estado: EstadoPago.APROBADO, metodo: MetodoPago.TARJETA });

      await service.procesarEvento(CUERPO, 'buena');
      await service.procesarEvento(CUERPO, 'buena');

      expect(ventas.marcarPagada).toHaveBeenCalledTimes(1);
    });

    it('un aviso de cobro sobre un pago ya RECHAZADO deja constancia para reembolso', async () => {
      // La secuencia real: la clienta se demora, la expiracion le cancela la
      // venta y deja el pago RECHAZADO, y la clienta paga igual — Stripe le
      // cobra de verdad. Antes la condicion `estado !== PENDIENTE` metia este
      // caso en la misma bolsa que el reintento benigno y lo descartaba en
      // silencio: plata cobrada, cero constancia.
      pasarela.verificarEvento.mockReturnValue({ id: 'evt_9', tipo: 'pagado', sesionId: 'ses_1' });
      pagoRepo.findOne.mockResolvedValue({
        id: 'p1', ventaId: 'v1', estado: EstadoPago.RECHAZADO, metodo: MetodoPago.TARJETA,
      });

      const res = await service.procesarEvento(CUERPO, 'buena');

      expect(res.procesado).toBe(false);
      expect(pagoRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ motivoReembolso: expect.stringContaining('reembolso') }),
      );
      // No se re-aprueba: el estado sigue siendo el que quedo, la marca es la
      // que avisa a una persona.
      expect(ventas.marcarPagada).not.toHaveBeenCalled();
    });

    it('ese caso tampoco le devuelve un error a la pasarela', async () => {
      pasarela.verificarEvento.mockReturnValue({ id: 'evt_9', tipo: 'pagado', sesionId: 'ses_1' });
      pagoRepo.findOne.mockResolvedValue({
        id: 'p1', ventaId: 'v1', estado: EstadoPago.REEMBOLSADO, metodo: MetodoPago.TARJETA,
      });
      await expect(service.procesarEvento(CUERPO, 'buena')).resolves.toBeDefined();
    });

    it('un reintento sobre un pago ya APROBADO no toca NADA: es benigno', async () => {
      // El contrapeso del caso de arriba: un pago aprobado que recibe el mismo
      // aviso otra vez es rutina de Stripe, y no debe ensuciar la fila con una
      // marca de reembolso.
      pasarela.verificarEvento.mockReturnValue({ id: 'evt_1', tipo: 'pagado', sesionId: 'ses_1' });
      pagoRepo.findOne.mockResolvedValue({
        id: 'p1', ventaId: 'v1', estado: EstadoPago.APROBADO, metodo: MetodoPago.TARJETA,
      });

      const res = await service.procesarEvento(CUERPO, 'buena');

      expect(res.procesado).toBe(false);
      expect(pagoRepo.save).not.toHaveBeenCalled();
      expect(ventas.marcarPagada).not.toHaveBeenCalled();
    });

    it('un evento que no es de pago se acepta sin hacer nada', async () => {
      // Stripe manda muchos tipos de evento. Devolver un error haria que reintente
      // para siempre algo que no nos interesa.
      pasarela.verificarEvento.mockReturnValue({ id: 'evt_2', tipo: 'otro', sesionId: null });
      const res = await service.procesarEvento(CUERPO, 'buena');
      expect(res.procesado).toBe(false);
      expect(ventas.marcarPagada).not.toHaveBeenCalled();
    });

    it('un evento para una sesion desconocida no explota', async () => {
      pasarela.verificarEvento.mockReturnValue({ id: 'evt_3', tipo: 'pagado', sesionId: 'no-existe' });
      pagoRepo.findOne.mockResolvedValue(null);
      const res = await service.procesarEvento(CUERPO, 'buena');
      expect(res.procesado).toBe(false);
      expect(ventas.marcarPagada).not.toHaveBeenCalled();
    });

    it('si la venta ya no se puede cobrar, el pago queda marcado para reembolso', async () => {
      // Caso real: la expiracion cancelo la venta y su stock ya volvio, pero la
      // clienta igual pago en la pasarela. El dinero entro: no se puede borrar
      // esa constancia, hay que dejarla a la vista.
      pasarela.verificarEvento.mockReturnValue({ id: 'evt_1', tipo: 'pagado', sesionId: 'ses_1' });
      pagoRepo.findOne.mockResolvedValue({
        id: 'p1', ventaId: 'v1', estado: EstadoPago.PENDIENTE, metodo: MetodoPago.TARJETA,
      });
      ventas.marcarPagada.mockRejectedValue(new Error('la venta esta CANCELADA'));

      const res = await service.procesarEvento(Buffer.from('{}'), 'buena');

      expect(res.procesado).toBe(false);
      expect(pagoRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ motivoReembolso: expect.stringContaining('reembolso') }),
      );
    });

    it('ese caso NO le devuelve un error a la pasarela', async () => {
      // Un 500 o un 409 harian que la pasarela reintente para siempre algo que
      // ningun reintento va a arreglar.
      pasarela.verificarEvento.mockReturnValue({ id: 'evt_1', tipo: 'pagado', sesionId: 'ses_1' });
      pagoRepo.findOne.mockResolvedValue({
        id: 'p1', ventaId: 'v1', estado: EstadoPago.PENDIENTE, metodo: MetodoPago.TARJETA,
      });
      ventas.marcarPagada.mockRejectedValue(new Error('la venta esta CANCELADA'));

      await expect(service.procesarEvento(Buffer.from('{}'), 'buena')).resolves.toBeDefined();
    });
  });
});
