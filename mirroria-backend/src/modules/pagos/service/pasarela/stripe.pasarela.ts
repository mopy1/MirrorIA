import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { FirmaWebhookInvalidaException } from '../../exception/firma-webhook-invalida.exception.js';
import { PasarelaNoConfiguradaException } from '../../exception/pasarela-no-configurada.exception.js';
import type {
  EventoNotificacionVerificado,
  EventoPago,
  IniciarCobroParams,
  IniciarCobroResultado,
  IPasarelaProveedor,
  Pasarela,
  PasarelaId,
  PasarelaMetadata,
  SesionPago,
} from './pasarela.interface.js';

@Injectable()
export class PasarelaStripe implements IPasarelaProveedor, Pasarela {
  private readonly logger = new Logger(PasarelaStripe.name);
  private readonly cliente: Stripe | null;
  private readonly secretoWebhook: string | undefined;
  private readonly moneda: 'bob' | 'usd';
  private readonly tipoCambio: number;

  readonly id: PasarelaId = 'STRIPE';
  readonly metadata: PasarelaMetadata = {
    id: 'STRIPE',
    nombre: 'Stripe (Tarjeta de crédito / débito)',
    descripcion: 'Pago seguro internacional con tarjeta de crédito o débito mediante Stripe Checkout.',
    tipo: 'TARJETA',
    estado: 'DISPONIBLE',
    soportaCheckout: true,
    soportaSuscripcion: true,
    icono: 'credit-card',
    monedas: ['USD', 'BOB'],
  };

  constructor(private readonly config: ConfigService) {
    const clave = config.get<string>('STRIPE_SECRET_KEY');
    this.cliente = clave ? new Stripe(clave) : null;
    this.secretoWebhook = config.get<string>('STRIPE_WEBHOOK_SECRET');
    // Los montos de MirrorIA siempre son centavos de boliviano. Stripe acepta
    // `bob` en Checkout con tarjeta (verificado en modo test; Amex no la
    // soporta), así que se cobra en Bs por defecto. Con STRIPE_MONEDA=usd se
    // convierte con STRIPE_TIPO_CAMBIO (Bs por USD) y se muestra el monto en Bs.
    this.moneda = config.get<string>('STRIPE_MONEDA')?.toLowerCase() === 'usd' ? 'usd' : 'bob';
    const tipo = Number(config.get<string>('STRIPE_TIPO_CAMBIO') ?? 6.96);
    this.tipoCambio = Number.isFinite(tipo) && tipo > 0 ? tipo : 6.96;
  }

  /**
   * Arma el `line_item` de Stripe a partir de un monto en centavos de Bs.
   * En `bob` va tal cual (Bs 80 = 8000); en `usd` se convierte al tipo de
   * cambio y la descripción lleva el monto original en Bs. El mínimo de
   * Stripe es el equivalente a 0,50 USD (~Bs 6 a su tipo de cambio).
   */
  lineaDeCobro(montoCentsBs: number, descripcion: string): Stripe.Checkout.SessionCreateParams.LineItem {
    const enUsd = this.moneda === 'usd';
    const montoBs = (montoCentsBs / 100).toLocaleString('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return {
      price_data: {
        currency: this.moneda,
        product_data: { name: enUsd ? `${descripcion} (Bs ${montoBs})` : descripcion },
        unit_amount: enUsd ? Math.round(montoCentsBs / this.tipoCambio) : montoCentsBs,
      },
      quantity: 1,
    };
  }

  estaConfigurada(): boolean {
    return this.cliente !== null && Boolean(this.secretoWebhook);
  }

  async iniciarCobro(params: IniciarCobroParams): Promise<IniciarCobroResultado> {
    if (!this.cliente) {
      throw new PasarelaNoConfiguradaException('Stripe no está configurado en este servidor.');
    }
    // `params.moneda` se ignora: el monto siempre llega en centavos de Bs y la
    // moneda de cobro la decide la configuración (ver `lineaDeCobro`).
    const sesion = await this.cliente.checkout.sessions.create({
      mode: 'payment',
      line_items: [this.lineaDeCobro(params.montoCents, params.descripcion)],
      success_url: params.urlExito,
      cancel_url: params.urlCancelacion,
      client_reference_id: params.referencia,
      expires_at: this.expiracionAcotada(params.expiraEn),
      metadata: params.metadata,
    });
    return {
      modo: 'REDIRECT',
      url: sesion.url ?? params.urlCancelacion,
      token: sesion.id,
      expiraEn: params.expiraEn,
    };
  }

  async verificarNotificacion(
    cuerpoCrudo: Buffer,
    cabeceras: Record<string, string>,
  ): Promise<EventoNotificacionVerificado> {
    const firma = cabeceras['stripe-signature'] ?? cabeceras['Stripe-Signature'] ?? '';
    const evento = this.verificarEvento(cuerpoCrudo, firma);
    return {
      id: evento.id,
      tipo: evento.tipo === 'pagado' ? 'PAGO_APROBADO' : 'OTRO',
      referenciaExterna: evento.sesionId ?? '',
    };
  }

  async crearSesion(params: {
    montoCents: number; descripcion: string; referencia: string;
    urlExito: string; urlCancelacion: string; expiraEn?: Date;
  }): Promise<SesionPago> {
    if (!this.cliente) {
      throw new Error('Stripe no esta configurado');
    }
    const sesion = await this.cliente.checkout.sessions.create({
      mode: 'payment',
      line_items: [this.lineaDeCobro(params.montoCents, params.descripcion)],
      success_url: params.urlExito,
      cancel_url: params.urlCancelacion,
      client_reference_id: params.referencia,
      expires_at: this.expiracionAcotada(params.expiraEn),
    });
    return { id: sesion.id, url: sesion.url ?? params.urlCancelacion };
  }

  private expiracionAcotada(expiraEn?: Date): number {
    const ahora = Date.now();
    const min = ahora + 31 * 60_000; // margen de 1 min sobre el minimo de Stripe
    const max = ahora + 23 * 60 * 60_000;
    const deseado = expiraEn?.getTime() ?? min;
    return Math.floor(Math.min(max, Math.max(min, deseado)) / 1000);
  }

  async recuperarSesion(sesionId: string): Promise<SesionPago | 'completa' | null> {
    if (!this.cliente) {
      throw new Error('Stripe no esta configurado');
    }
    try {
      const sesion = await this.cliente.checkout.sessions.retrieve(sesionId);
      if (sesion.status === 'complete') {
        return 'completa';
      }
      if (sesion.status !== 'open' || !sesion.url) {
        return null;
      }
      return { id: sesion.id, url: sesion.url };
    } catch (error) {
      this.logger.warn(`No se pudo recuperar la sesion ${sesionId}: ${String(error)}`);
      return null;
    }
  }

  async cerrarSesion(sesionId: string): Promise<boolean> {
    if (!this.cliente) return true;
    try {
      const sesion = await this.cliente.checkout.sessions.retrieve(sesionId);
      if (sesion.status === 'expired') return true;
      if (sesion.status !== 'open') return false;
      await this.cliente.checkout.sessions.expire(sesionId);
      return true;
    } catch (error) {
      this.logger.warn(`No se pudo cerrar la sesion ${sesionId}: ${String(error)}`);
      return false;
    }
  }

  verificarEvento(cuerpoCrudo: Buffer, firma: string): EventoPago {
    if (!this.cliente || !this.secretoWebhook) {
      throw new FirmaWebhookInvalidaException();
    }
    let evento: Stripe.Event;
    try {
      evento = this.cliente.webhooks.constructEvent(cuerpoCrudo, firma, this.secretoWebhook);
    } catch (error) {
      this.logger.warn(`Webhook con firma invalida: ${String(error)}`);
      throw new FirmaWebhookInvalidaException();
    }

    if (evento.type !== 'checkout.session.completed') {
      return { id: evento.id, tipo: 'otro', sesionId: null };
    }
    const sesion = evento.data.object as Stripe.Checkout.Session;
    if (sesion.payment_status !== 'paid') {
      this.logger.warn(
        `Sesion ${sesion.id} completada pero sin pagar (payment_status=${sesion.payment_status}): no se cobra`,
      );
      return { id: evento.id, tipo: 'otro', sesionId: null };
    }
    return { id: evento.id, tipo: 'pagado', sesionId: sesion.id };
  }
}
