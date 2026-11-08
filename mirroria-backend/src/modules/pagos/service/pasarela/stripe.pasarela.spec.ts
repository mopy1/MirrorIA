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

/** Pasarela con `checkout.sessions.create` falso que devuelve lo que se le pidió. */
function pasarelaCobro(valores: Record<string, string | undefined>) {
  const config = {
    get: vi.fn((clave: string) =>
      clave === 'STRIPE_SECRET_KEY' ? 'sk_test_falsa' : clave === 'STRIPE_WEBHOOK_SECRET' ? 'whsec_falsa' : valores[clave],
    ),
  } as unknown as ConfigService;
  const pasarela = new PasarelaStripe(config);
  const create = vi.fn().mockResolvedValue({ id: 'cs_1', url: 'https://checkout.stripe.com/c/cs_1' });
  const interna = pasarela as unknown as { cliente: Stripe };
  interna.cliente.checkout = { sessions: { create } } as unknown as Stripe['checkout'];
  return { pasarela, create };
}

const SESION = { montoCents: 8000, descripcion: 'Tiendaria — Compra #ABC', referencia: 'v1', urlExito: 'x', urlCancelacion: 'y' };

function precioPedido(create: ReturnType<typeof vi.fn>) {
  const linea = (create.mock.calls[0][0] as Stripe.Checkout.SessionCreateParams).line_items![0];
  return linea.price_data as Stripe.Checkout.SessionCreateParams.LineItem.PriceData & {
    product_data: { name: string };
  };
}

describe('PasarelaStripe — moneda del cobro (Bs 80 no es USD 80)', () => {
  it('sin STRIPE_MONEDA cobra en bob con los mismos centavos', async () => {
    const { pasarela, create } = pasarelaCobro({});
    await pasarela.crearSesion(SESION);
    const precio = precioPedido(create);
    expect(precio.currency).toBe('bob');
    expect(precio.unit_amount).toBe(8000);
    expect(precio.product_data.name).toBe(SESION.descripcion);
  });

  it('con STRIPE_MONEDA=usd convierte al tipo de cambio por defecto (6,96) y muestra los Bs', async () => {
    const { pasarela, create } = pasarelaCobro({ STRIPE_MONEDA: 'USD' });
    await pasarela.crearSesion(SESION);
    const precio = precioPedido(create);
    expect(precio.currency).toBe('usd');
    expect(precio.unit_amount).toBe(1149); // 8000 / 6,96 = 1149,4 → USD 11,49
    expect(precio.product_data.name).toBe('Tiendaria — Compra #ABC (Bs 80,00)');
  });

  it('respeta STRIPE_TIPO_CAMBIO y descarta uno inválido', async () => {
    const a = pasarelaCobro({ STRIPE_MONEDA: 'usd', STRIPE_TIPO_CAMBIO: '10' });
    await a.pasarela.crearSesion(SESION);
    expect(precioPedido(a.create).unit_amount).toBe(800);
    const b = pasarelaCobro({ STRIPE_MONEDA: 'usd', STRIPE_TIPO_CAMBIO: 'cero' });
    await b.pasarela.crearSesion(SESION);
    expect(precioPedido(b.create).unit_amount).toBe(1149);
  });

  it('el cobro de suscripción (iniciarCobro) usa la misma regla aunque pida BOB', async () => {
    const { pasarela, create } = pasarelaCobro({ STRIPE_MONEDA: 'usd' });
    const r = await pasarela.iniciarCobro({
      ...SESION,
      montoCents: 34800,
      moneda: 'BOB',
      contexto: 'suscripcion',
      nombreComercio: 'Tiendaria',
    });
    expect(r).toMatchObject({ modo: 'REDIRECT', token: 'cs_1' });
    expect(precioPedido(create)).toMatchObject({ currency: 'usd', unit_amount: 5000 });
  });
});
