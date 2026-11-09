import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { FirmaWebhookInvalidaException } from '../../exception/firma-webhook-invalida.exception.js';
import { PasarelaNoConfiguradaException } from '../../exception/pasarela-no-configurada.exception.js';
import { centavosBobAUsd, tipoCambioBobUsd } from './moneda.js';
import type {
  ConfirmacionCobro,
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
  private readonly moneda: string;
  private readonly tipoCambio: number;

  readonly id: PasarelaId = 'STRIPE';
  readonly metadata: PasarelaMetadata;

  constructor(private readonly config: ConfigService) {
    const clave = config.get<string>('STRIPE_SECRET_KEY');
    this.cliente = clave ? new Stripe(clave) : null;
    this.secretoWebhook = config.get<string>('STRIPE_WEBHOOK_SECRET');
    // BOB puede no estar habilitada en una cuenta de prueba; por eso es
    // configurable y cae en usd, que siempre funciona en modo test.
    this.moneda = (config.get<string>('STRIPE_MONEDA') ?? 'usd').toLowerCase();
    this.tipoCambio = tipoCambioBobUsd(config);
    this.metadata = {
      id: 'STRIPE',
      nombre: 'Stripe (Tarjeta de crédito / débito)',
      descripcion: 'Pago seguro internacional con tarjeta de crédito o débito mediante Stripe Checkout.',
      tipo: 'TARJETA',
      estado: this.estaConfigurada() ? 'DISPONIBLE' : 'NO_CONFIGURADA',
      soportaCheckout: true,
      soportaSuscripcion: true,
      icono: 'credit-card',
      monedas: ['USD', 'BOB'],
    };
  }

  /**
   * Basta la clave secreta: el pago se confirma al volver de Stripe
   * (`confirmar-tarjeta` recupera la sesión). El webhook es un respaldo
   * opcional y sin su secreto `verificarEvento` rechaza los avisos.
   */
  estaConfigurada(): boolean {
    return this.cliente !== null;
  }

  async iniciarCobro(params: IniciarCobroParams): Promise<IniciarCobroResultado> {
    if (!this.cliente) {
      throw new PasarelaNoConfiguradaException('Stripe no está configurado en este servidor.');
    }
    const precio = this.precio(params.montoCents, params.montoUsdCents);
    const sesion = await this.cliente.checkout.sessions.create({
      mode: 'payment',
      // Prendido por defecto en cuentas nuevas: exige tax_code por producto.
      managed_payments: { enabled: false },
      // Sin esto Stripe convierte a su propio tipo de cambio y muestra otro precio en Bs.
      adaptive_pricing: { enabled: false },
      line_items: [
        {
          price_data: {
            ...precio,
            product_data: { name: params.descripcion },
          },
          quantity: 1,
        },
      ],
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
      montoCobrado: {
        cents: precio.unit_amount,
        moneda: precio.currency === 'usd' ? 'USD' : 'BOB',
      },
    };
  }

  /** Los montos del sistema son bolivianos: cobrarlos en usd sin convertir multiplica el precio. */
  private precio(montoCents: number, montoUsdCents?: number): { currency: string; unit_amount: number } {
    if (this.moneda !== 'usd') {
      return { currency: this.moneda, unit_amount: montoCents };
    }
    return {
      currency: 'usd',
      unit_amount: montoUsdCents || centavosBobAUsd(montoCents, this.tipoCambio),
    };
  }

  async confirmarCobro(sesionId: string): Promise<ConfirmacionCobro> {
    if (!this.cliente) return { estado: 'PENDIENTE' };
    try {
      const sesion = await this.cliente.checkout.sessions.retrieve(sesionId);
      if (sesion.payment_status === 'paid') {
        const intento = sesion.payment_intent;
        return {
          estado: 'APROBADO',
          transaccion: (typeof intento === 'string' ? intento : intento?.id) ?? sesion.id,
          montoCents: sesion.amount_total ?? undefined,
        };
      }
      return sesion.status === 'expired' ? { estado: 'RECHAZADO' } : { estado: 'PENDIENTE' };
    } catch (error) {
      this.logger.warn(`No se pudo consultar la sesion ${sesionId}: ${String(error)}`);
      return { estado: 'PENDIENTE' };
    }
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
      // Prendido por defecto en cuentas nuevas: exige tax_code por producto.
      managed_payments: { enabled: false },
      // Sin esto Stripe convierte a su propio tipo de cambio y muestra otro precio en Bs.
      adaptive_pricing: { enabled: false },
      line_items: [
        {
          price_data: {
            ...this.precio(params.montoCents),
            product_data: { name: params.descripcion },
          },
          quantity: 1,
        },
      ],
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
