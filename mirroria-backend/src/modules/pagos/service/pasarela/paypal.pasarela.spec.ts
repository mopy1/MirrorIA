import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import { FirmaWebhookInvalidaException } from '../../exception/firma-webhook-invalida.exception.js';
import { PasarelaNoConfiguradaException } from '../../exception/pasarela-no-configurada.exception.js';
import { PaypalPasarela } from './paypal.pasarela.js';
import type { IniciarCobroParams } from './pasarela.interface.js';

const API = 'https://api-m.sandbox.paypal.com';

interface Llamada {
  url: string;
  init: RequestInit;
}

/** Sustituye solo la red: lo que se prueba es que armamos y leemos bien la API de PayPal. */
function redCon(respuestas: Record<string, { status?: number; body: unknown }>): Llamada[] {
  const llamadas: Llamada[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit) => {
      llamadas.push({ url, init });
      const ruta = url.replace(API, '');
      if (ruta === '/v1/oauth2/token') {
        return new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 }), { status: 200 });
      }
      const r = respuestas[ruta];
      if (!r) return new Response('{}', { status: 404 });
      return new Response(JSON.stringify(r.body), { status: r.status ?? 200 });
    }),
  );
  return llamadas;
}

function pasarela(valores: Record<string, string> = {}): PaypalPasarela {
  const todos: Record<string, string> = {
    PAYPAL_CLIENT_ID: 'cliente',
    PAYPAL_CLIENT_SECRET: 'secreto',
    PAYPAL_WEBHOOK_ID: 'wh-1',
    ...valores,
  };
  return new PaypalPasarela({ get: vi.fn((k: string) => todos[k]) } as unknown as ConfigService);
}

const sinClaves = () => new PaypalPasarela({ get: vi.fn() } as unknown as ConfigService);

const COBRO: IniciarCobroParams = {
  montoCents: 9900,
  montoUsdCents: 1500,
  moneda: 'BOB',
  descripcion: 'Suscripción Básico — Boutique Luna',
  referencia: 'cobro-1',
  contexto: 'suscripcion',
  nombreComercio: 'Boutique Luna',
  urlExito: 'http://localhost:5174/admin/suscripcion?pago=exito&cobro=cobro-1',
  urlCancelacion: 'http://localhost:5174/admin/suscripcion/activar?pago=cancelado',
};

const ORDEN_CREADA = {
  id: 'ORDEN-1',
  status: 'PAYER_ACTION_REQUIRED',
  links: [
    { rel: 'self', href: `${API}/v2/checkout/orders/ORDEN-1` },
    { rel: 'payer-action', href: 'https://www.sandbox.paypal.com/checkoutnow?token=ORDEN-1' },
  ],
};

const captura = (status: string) => ({
  id: 'ORDEN-1',
  status: 'COMPLETED',
  purchase_units: [
    { payments: { captures: [{ id: 'CAP-1', status, amount: { currency_code: 'USD', value: '15.00' } }] } },
  ],
});

describe('PaypalPasarela', () => {
  afterEach(() => vi.unstubAllGlobals());

  describe('configuracion', () => {
    it('sin credenciales no esta configurada y no se ofrece como disponible', () => {
      const p = sinClaves();
      expect(p.estaConfigurada()).toBe(false);
      expect(p.metadata.estado).toBe('NO_CONFIGURADA');
    });

    it('con credenciales queda disponible para suscripciones y compras', () => {
      const p = pasarela();
      expect(p.estaConfigurada()).toBe(true);
      expect(p.metadata.estado).toBe('DISPONIBLE');
      expect(p.metadata.soportaSuscripcion).toBe(true);
      expect(p.metadata.soportaCheckout).toBe(true);
    });

    it('apunta al sandbox salvo que se pida live a proposito', async () => {
      const llamadas = redCon({ '/v2/checkout/orders': { status: 201, body: ORDEN_CREADA } });
      await pasarela().iniciarCobro(COBRO);
      expect(llamadas[0].url).toBe(`${API}/v1/oauth2/token`);
    });
  });

  describe('iniciarCobro', () => {
    it('crea la orden en dolares con el precio USD del plan y manda a aprobar', async () => {
      const llamadas = redCon({ '/v2/checkout/orders': { status: 201, body: ORDEN_CREADA } });

      const r = await pasarela().iniciarCobro(COBRO);

      expect(r).toMatchObject({
        modo: 'REDIRECT',
        url: 'https://www.sandbox.paypal.com/checkoutnow?token=ORDEN-1',
        token: 'ORDEN-1',
        montoCobrado: { cents: 1500, moneda: 'USD' },
      });
      const cuerpo = JSON.parse(String(llamadas[1].init.body));
      expect(cuerpo.intent).toBe('CAPTURE');
      expect(cuerpo.purchase_units[0].amount).toEqual({ currency_code: 'USD', value: '15.00' });
      expect(cuerpo.purchase_units[0].custom_id).toBe('cobro-1');
      expect(cuerpo.payment_source.paypal.experience_context.return_url).toBe(COBRO.urlExito);
      expect(cuerpo.payment_source.paypal.experience_context.cancel_url).toBe(COBRO.urlCancelacion);
    });

    it('sin precio USD convierte desde bolivianos: nunca cobra los Bs como dolares', async () => {
      const llamadas = redCon({ '/v2/checkout/orders': { status: 201, body: ORDEN_CREADA } });
      await pasarela().iniciarCobro({ ...COBRO, montoCents: 69600, montoUsdCents: undefined });
      const cuerpo = JSON.parse(String(llamadas[1].init.body));
      expect(cuerpo.purchase_units[0].amount.value).toBe('100.00');
    });

    it('manda clave de idempotencia: un reintento no abre otra orden', async () => {
      const llamadas = redCon({ '/v2/checkout/orders': { status: 201, body: ORDEN_CREADA } });
      await pasarela().iniciarCobro(COBRO);
      expect((llamadas[1].init.headers as Record<string, string>)['PayPal-Request-Id']).toBe('cobro-1');
    });

    it('si PayPal falla responde 503 y no inventa una URL', async () => {
      redCon({ '/v2/checkout/orders': { status: 500, body: { name: 'INTERNAL_SERVER_ERROR' } } });
      await expect(pasarela().iniciarCobro(COBRO)).rejects.toThrow(PasarelaNoConfiguradaException);
    });

    it('sin credenciales no llama a nadie', async () => {
      const llamadas = redCon({});
      await expect(sinClaves().iniciarCobro(COBRO)).rejects.toThrow(PasarelaNoConfiguradaException);
      expect(llamadas).toHaveLength(0);
    });
  });

  describe('confirmarCobro: aprobar la orden no cobra, cobra la captura', () => {
    const RUTA = '/v2/checkout/orders/ORDEN-1/capture';

    it('captura completada: aprobado, con transaccion y monto en centavos', async () => {
      redCon({ [RUTA]: { status: 201, body: captura('COMPLETED') } });
      await expect(pasarela().confirmarCobro('ORDEN-1')).resolves.toEqual({
        estado: 'APROBADO',
        transaccion: 'CAP-1',
        montoCents: 1500,
      });
    });

    it('captura en revision (PENDING): todavia no se acredita', async () => {
      redCon({ [RUTA]: { status: 201, body: captura('PENDING') } });
      await expect(pasarela().confirmarCobro('ORDEN-1')).resolves.toEqual({ estado: 'PENDIENTE' });
    });

    it('la clienta no aprobo la orden: sigue pendiente', async () => {
      redCon({ [RUTA]: { status: 422, body: { details: [{ issue: 'ORDER_NOT_APPROVED' }] } } });
      await expect(pasarela().confirmarCobro('ORDEN-1')).resolves.toEqual({ estado: 'PENDIENTE' });
    });

    it('fondos rechazados: rechazado', async () => {
      redCon({ [RUTA]: { status: 422, body: { details: [{ issue: 'INSTRUMENT_DECLINED' }] } } });
      await expect(pasarela().confirmarCobro('ORDEN-1')).resolves.toEqual({ estado: 'RECHAZADO' });
    });

    it('orden ya capturada (regreso y webhook a la vez): lee la captura existente', async () => {
      redCon({
        [RUTA]: { status: 422, body: { details: [{ issue: 'ORDER_ALREADY_CAPTURED' }] } },
        '/v2/checkout/orders/ORDEN-1': { body: captura('COMPLETED') },
      });
      await expect(pasarela().confirmarCobro('ORDEN-1')).resolves.toMatchObject({
        estado: 'APROBADO',
        transaccion: 'CAP-1',
      });
    });

    it('la captura lleva clave de idempotencia atada a la orden', async () => {
      const llamadas = redCon({ [RUTA]: { status: 201, body: captura('COMPLETED') } });
      await pasarela().confirmarCobro('ORDEN-1');
      expect((llamadas[1].init.headers as Record<string, string>)['PayPal-Request-Id']).toBe(
        'captura-ORDEN-1',
      );
    });

    it('PayPal caido: no se da por pagado, queda pendiente', async () => {
      redCon({ [RUTA]: { status: 500, body: {} } });
      await expect(pasarela().confirmarCobro('ORDEN-1')).resolves.toEqual({ estado: 'PENDIENTE' });
    });
  });

  describe('verificarNotificacion', () => {
    const RUTA = '/v1/notifications/verify-webhook-signature';
    const cabeceras = {
      'paypal-auth-algo': 'SHA256withRSA',
      'paypal-cert-url': 'https://api.paypal.com/cert',
      'paypal-transmission-id': 'tx-1',
      'paypal-transmission-sig': 'firma',
      'paypal-transmission-time': '2026-11-07T00:00:00Z',
    };
    const aprobada = Buffer.from(
      '{"id":"WH-1","event_type":"CHECKOUT.ORDER.APPROVED","resource":{"id":"ORDEN-1"}}',
    );
    const capturada = Buffer.from(
      '{"id":"WH-2","event_type":"PAYMENT.CAPTURE.COMPLETED","resource":{"id":"CAP-1","supplementary_data":{"related_ids":{"order_id":"ORDEN-1"}}}}',
    );

    it('firma valida y orden aprobada: reporta la orden', async () => {
      redCon({ [RUTA]: { body: { verification_status: 'SUCCESS' } } });
      await expect(pasarela().verificarNotificacion(aprobada, cabeceras)).resolves.toEqual({
        id: 'WH-1',
        tipo: 'PAGO_APROBADO',
        referenciaExterna: 'ORDEN-1',
      });
    });

    it('captura completada: saca la orden de los ids relacionados, no el id de captura', async () => {
      redCon({ [RUTA]: { body: { verification_status: 'SUCCESS' } } });
      const e = await pasarela().verificarNotificacion(capturada, cabeceras);
      expect(e.referenciaExterna).toBe('ORDEN-1');
    });

    it('verifica el cuerpo crudo byte por byte, sin reserializarlo', async () => {
      const llamadas = redCon({ [RUTA]: { body: { verification_status: 'SUCCESS' } } });
      const conEspacios = Buffer.from('{ "id":"WH-1", "event_type":"OTRO.EVENTO", "resource":{} }');
      await pasarela().verificarNotificacion(conEspacios, cabeceras);
      expect(String(llamadas[1].init.body)).toContain(conEspacios.toString('utf8'));
    });

    it('firma invalida: lanza y no reporta nada', async () => {
      redCon({ [RUTA]: { body: { verification_status: 'FAILURE' } } });
      await expect(pasarela().verificarNotificacion(aprobada, cabeceras)).rejects.toThrow(
        FirmaWebhookInvalidaException,
      );
    });

    it('sin PAYPAL_WEBHOOK_ID no acepta avisos', async () => {
      const llamadas = redCon({});
      await expect(
        pasarela({ PAYPAL_WEBHOOK_ID: '' }).verificarNotificacion(aprobada, cabeceras),
      ).rejects.toThrow(FirmaWebhookInvalidaException);
      expect(llamadas).toHaveLength(0);
    });

    it('un evento de otro tipo se ignora', async () => {
      redCon({ [RUTA]: { body: { verification_status: 'SUCCESS' } } });
      const otro = Buffer.from('{"id":"WH-3","event_type":"PAYMENT.CAPTURE.DENIED","resource":{"id":"X"}}');
      await expect(pasarela().verificarNotificacion(otro, cabeceras)).resolves.toMatchObject({ tipo: 'OTRO' });
    });
  });
});
