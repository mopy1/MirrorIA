import { describe, expect, it, vi } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import type Stripe from 'stripe';
import { PasarelaStripe } from './stripe.pasarela.js';
import { FirmaWebhookInvalidaException } from '../../exception/firma-webhook-invalida.exception.js';

const CUERPO = Buffer.from('{}');
const FIRMA = 't=1,v1=loquesea';

/**
 * Construye la pasarela con claves de mentira (el SDK no pega a la red al
 * instanciarse) y sustituye `webhooks.constructEvent`, que es lo unico que
 * hace falta de Stripe para probar la decision: el evento ya viene verificado
 * y lo que se prueba es que se mira el estado de pago de la sesion.
 */
function pasarelaCon(evento: Stripe.Event): PasarelaStripe {
  const config = {
    get: vi.fn((clave: string) =>
      clave === 'STRIPE_SECRET_KEY' ? 'sk_test_falsa' : 'whsec_falsa',
    ),
  } as unknown as ConfigService;
  const pasarela = new PasarelaStripe(config);
  const interna = pasarela as unknown as { cliente: Stripe };
  interna.cliente.webhooks = {
    constructEvent: vi.fn().mockReturnValue(evento),
  } as unknown as Stripe['webhooks'];
  return pasarela;
}

function eventoDeSesion(payment_status: string): Stripe.Event {
  return {
    id: 'evt_1',
    type: 'checkout.session.completed',
    data: { object: { id: 'cs_1', payment_status } },
  } as unknown as Stripe.Event;
}

describe('PasarelaStripe — `checkout.session.completed` NO significa cobrado', () => {
  it('una sesion completada Y pagada si se reporta como pagada', () => {
    const evento = pasarelaCon(eventoDeSesion('paid')).verificarEvento(CUERPO, FIRMA);
    expect(evento).toEqual({ id: 'evt_1', tipo: 'pagado', sesionId: 'cs_1' });
  });

  it('una sesion completada pero SIN pagar no se reporta como pagada', () => {
    // Con metodos de notificacion diferida el evento llega con la sesion sin
    // pagar y el cobro se confirma despues, con otro evento. Sin este chequeo
    // era la unica forma en todo el modulo de dar por cobrado algo no cobrado:
    // la sesion se crea sin acotar `payment_method_types`, asi que alcanzaba
    // con habilitar uno de esos metodos en el panel de Stripe.
    const evento = pasarelaCon(eventoDeSesion('unpaid')).verificarEvento(CUERPO, FIRMA);
    expect(evento.tipo).toBe('otro');
    expect(evento.sesionId).toBeNull();
  });

  it('una sesion que no requiere pago tampoco cobra', () => {
    const evento = pasarelaCon(eventoDeSesion('no_payment_required')).verificarEvento(
      CUERPO,
      FIRMA,
    );
    expect(evento.tipo).toBe('otro');
  });

  it('un evento de otro tipo se ignora, pase lo que pase con la sesion', () => {
    const otro = {
      id: 'evt_2',
      type: 'payment_intent.created',
      data: { object: { id: 'pi_1', payment_status: 'paid' } },
    } as unknown as Stripe.Event;
    expect(pasarelaCon(otro).verificarEvento(CUERPO, FIRMA).tipo).toBe('otro');
  });

  it('sin claves configuradas no verifica nada: lanza', () => {
    const config = { get: vi.fn().mockReturnValue(undefined) } as unknown as ConfigService;
    const pasarela = new PasarelaStripe(config);
    expect(pasarela.estaConfigurada()).toBe(false);
    expect(() => pasarela.verificarEvento(CUERPO, FIRMA)).toThrow(FirmaWebhookInvalidaException);
  });
});

describe('PasarelaStripe — moneda y confirmacion del regreso', () => {
  const crear = vi.fn();
  const recuperar = vi.fn();

  function pasarelaReal(valores: Record<string, string> = {}): PasarelaStripe {
    const todos: Record<string, string> = {
      STRIPE_SECRET_KEY: 'sk_test_falsa',
      STRIPE_WEBHOOK_SECRET: 'whsec_falsa',
      ...valores,
    };
    const pasarela = new PasarelaStripe({ get: vi.fn((k: string) => todos[k]) } as unknown as ConfigService);
    (pasarela as unknown as { cliente: Stripe }).cliente.checkout.sessions = {
      create: crear,
      retrieve: recuperar,
    } as unknown as Stripe['checkout']['sessions'];
    crear.mockReset().mockResolvedValue({ id: 'cs_1', url: 'https://checkout.stripe.com/c/cs_1' });
    recuperar.mockReset();
    return pasarela;
  }

  const precioEnviado = () => crear.mock.calls[0][0].line_items[0].price_data;
  const BASE = {
    descripcion: 'x',
    referencia: 'r',
    urlExito: 'http://a/b',
    urlCancelacion: 'http://a/c',
  };

  it('una venta de Bs 696 se cobra USD 100, no USD 696', async () => {
    await pasarelaReal().crearSesion({ ...BASE, montoCents: 69600 });
    expect(precioEnviado()).toMatchObject({ currency: 'usd', unit_amount: 10000 });
  });

  it('respeta el tipo de cambio configurado', async () => {
    await pasarelaReal({ TIPO_CAMBIO_BOB_USD: '10' }).crearSesion({ ...BASE, montoCents: 69600 });
    expect(precioEnviado()).toMatchObject({ unit_amount: 6960 });
  });

  it('con STRIPE_MONEDA=bob cobra los bolivianos sin convertir', async () => {
    await pasarelaReal({ STRIPE_MONEDA: 'bob' }).crearSesion({ ...BASE, montoCents: 69600 });
    expect(precioEnviado()).toMatchObject({ currency: 'bob', unit_amount: 69600 });
  });

  it('una suscripcion se cobra con el precio USD del plan', async () => {
    const r = await pasarelaReal().iniciarCobro({
      ...BASE,
      montoCents: 9900,
      montoUsdCents: 1500,
      moneda: 'BOB',
      contexto: 'suscripcion',
      nombreComercio: 'Luna',
    });
    expect(precioEnviado()).toMatchObject({ currency: 'usd', unit_amount: 1500 });
    expect(r.montoCobrado).toEqual({ cents: 1500, moneda: 'USD' });
  });

  it('sin claves no se ofrece como disponible', () => {
    const p = new PasarelaStripe({ get: vi.fn() } as unknown as ConfigService);
    expect(p.metadata.estado).toBe('NO_CONFIGURADA');
  });

  it('sesion pagada: aprobado, con el payment_intent y el monto real', async () => {
    const p = pasarelaReal();
    recuperar.mockResolvedValue({
      status: 'complete', payment_status: 'paid', payment_intent: 'pi_1', amount_total: 1500,
    });
    await expect(p.confirmarCobro('cs_1')).resolves.toEqual({
      estado: 'APROBADO', transaccion: 'pi_1', montoCents: 1500,
    });
  });

  it('sesion completa pero sin pagar: sigue pendiente', async () => {
    const p = pasarelaReal();
    recuperar.mockResolvedValue({ status: 'complete', payment_status: 'unpaid' });
    await expect(p.confirmarCobro('cs_1')).resolves.toEqual({ estado: 'PENDIENTE' });
  });

  it('sesion vencida: rechazado', async () => {
    const p = pasarelaReal();
    recuperar.mockResolvedValue({ status: 'expired', payment_status: 'unpaid' });
    await expect(p.confirmarCobro('cs_1')).resolves.toEqual({ estado: 'RECHAZADO' });
  });

  it('Stripe caido: no se da por pagado', async () => {
    const p = pasarelaReal();
    recuperar.mockRejectedValue(new Error('red'));
    await expect(p.confirmarCobro('cs_1')).resolves.toEqual({ estado: 'PENDIENTE' });
  });
});

describe('PasarelaStripe — Managed Payments', () => {
  it('apaga Managed Payments: las cuentas nuevas lo traen prendido y exige tax_code por producto', async () => {
    const crear = vi.fn().mockResolvedValue({ id: 'cs_1', url: 'https://checkout.stripe.com/c/cs_1' });
    const valores: Record<string, string> = { STRIPE_SECRET_KEY: 'sk_test_falsa', STRIPE_WEBHOOK_SECRET: 'whsec_falsa' };
    const pasarela = new PasarelaStripe({ get: vi.fn((k: string) => valores[k]) } as unknown as ConfigService);
    (pasarela as unknown as { cliente: Stripe }).cliente.checkout.sessions = {
      create: crear,
    } as unknown as Stripe['checkout']['sessions'];
    const base = { descripcion: 'x', referencia: 'r', urlExito: 'http://a/b', urlCancelacion: 'http://a/c', montoCents: 6960 };

    await pasarela.crearSesion(base);
    await pasarela.iniciarCobro({ ...base, moneda: 'BOB', contexto: 'suscripcion', nombreComercio: 'Luna' });

    expect(crear.mock.calls[0][0].managed_payments).toEqual({ enabled: false });
    expect(crear.mock.calls[1][0].managed_payments).toEqual({ enabled: false });
    // Con esto prendido una clienta en Bolivia veria el plan de Bs 99 como Bs 184.
    expect(crear.mock.calls[0][0].adaptive_pricing).toEqual({ enabled: false });
    expect(crear.mock.calls[1][0].adaptive_pricing).toEqual({ enabled: false });
  });
});
