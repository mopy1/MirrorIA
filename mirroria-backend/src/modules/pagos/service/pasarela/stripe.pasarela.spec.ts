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
