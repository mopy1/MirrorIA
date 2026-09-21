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
    return { id: evento.id, tipo: 'pagado', sesionId: sesion.id };
  }
}
