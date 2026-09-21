import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { FirmaWebhookInvalidaException } from '../../exception/firma-webhook-invalida.exception.js';
import type { EventoPago, Pasarela, SesionPago } from './pasarela.interface.js';

@Injectable()
export class PasarelaStripe implements Pasarela {
  private readonly logger = new Logger(PasarelaStripe.name);
  private readonly cliente: Stripe | null;
  private readonly secretoWebhook: string | undefined;
  private readonly moneda: string;

  constructor(private readonly config: ConfigService) {
    const clave = config.get<string>('STRIPE_SECRET_KEY');
    this.cliente = clave ? new Stripe(clave) : null;
    this.secretoWebhook = config.get<string>('STRIPE_WEBHOOK_SECRET');
    // BOB puede no estar habilitada en una cuenta de prueba; por eso es
    // configurable y cae en usd, que siempre funciona en modo test.
    this.moneda = config.get<string>('STRIPE_MONEDA') ?? 'usd';
  }

  estaConfigurada(): boolean {
    return this.cliente !== null && Boolean(this.secretoWebhook);
  }

  async crearSesion(params: {
    montoCents: number; descripcion: string; referencia: string;
    urlExito: string; urlCancelacion: string;
  }): Promise<SesionPago> {
    if (!this.cliente) {
      throw new Error('Stripe no esta configurado');
    }
    const sesion = await this.cliente.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: this.moneda,
            product_data: { name: params.descripcion },
            unit_amount: params.montoCents,
          },
          quantity: 1,
        },
      ],
      success_url: params.urlExito,
      cancel_url: params.urlCancelacion,
      client_reference_id: params.referencia,
    });
    return { id: sesion.id, url: sesion.url ?? params.urlCancelacion };
  }

  async recuperarSesion(sesionId: string): Promise<SesionPago | null> {
    if (!this.cliente) {
      throw new Error('Stripe no esta configurado');
    }
    try {
      const sesion = await this.cliente.checkout.sessions.retrieve(sesionId);
      // `open` es el unico estado en el que la clienta todavia puede pagar; una
      // sesion `expired` o `complete` ya no sirve para mandarla de vuelta
      // (valores verificados contra los tipos del SDK: Session.Status).
      if (sesion.status !== 'open' || !sesion.url) {
        return null;
      }
      return { id: sesion.id, url: sesion.url };
    } catch (error) {
      // Que la pasarela no reconozca la sesion no puede dejar a la clienta sin
      // poder pagar: se anota y quien llama crea una nueva.
      this.logger.warn(`No se pudo recuperar la sesion ${sesionId}: ${String(error)}`);
      return null;
    }
  }

  verificarEvento(cuerpoCrudo: Buffer, firma: string): EventoPago {
    if (!this.cliente || !this.secretoWebhook) {
      throw new FirmaWebhookInvalidaException();
    }
    let evento: Stripe.Event;
    try {
      // Contra el cuerpo CRUDO: si se parsea antes, la firma no valida nunca.
      evento = this.cliente.webhooks.constructEvent(cuerpoCrudo, firma, this.secretoWebhook);
    } catch (error) {
      this.logger.warn(`Webhook con firma invalida: ${String(error)}`);
      throw new FirmaWebhookInvalidaException();
    }

    if (evento.type !== 'checkout.session.completed') {
      return { id: evento.id, tipo: 'otro', sesionId: null };
    }
    const sesion = evento.data.object as Stripe.Checkout.Session;
    // `checkout.session.completed` NO significa cobrado: con los metodos de
    // notificacion diferida (boleto, transferencias, debitos) el evento llega
    // con la sesion todavia sin pagar y el cobro se confirma despues con
    // `checkout.session.async_payment_succeeded`. Como la sesion se crea sin
    // acotar `payment_method_types`, basta habilitar uno de esos metodos en el
    // panel de Stripe para que el sistema diera por cobrada una venta sin que
    // entrara un centavo. `payment_status` es el campo que lo distingue
    // ('paid' | 'unpaid' | 'no_payment_required', ver
    // node_modules/stripe/esm/resources/Checkout/Sessions.d.ts).
    if (sesion.payment_status !== 'paid') {
      this.logger.warn(
        `Sesion ${sesion.id} completada pero sin pagar (payment_status=${sesion.payment_status}): no se cobra`,
      );
      return { id: evento.id, tipo: 'otro', sesionId: null };
    }
    return { id: evento.id, tipo: 'pagado', sesionId: sesion.id };
  }
}
