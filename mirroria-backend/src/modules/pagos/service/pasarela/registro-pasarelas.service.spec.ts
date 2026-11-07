import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import { PasarelaNoConfiguradaException } from '../../exception/pasarela-no-configurada.exception.js';
import { ManualPasarela } from './manual.pasarela.js';
import { PaypalPasarela } from './paypal.pasarela.js';
import { QrBancarioPasarela } from './qr-bancario.pasarela.js';
import { RegistroPasarelasService } from './registro-pasarelas.service.js';
import { PasarelaStripe } from './stripe.pasarela.js';
import { WayraPasarela } from './wayra.pasarela.js';

describe('RegistroPasarelasService & Pasarelas Enchufables', () => {
  let config: ConfigService;
  let stripe: PasarelaStripe;
  let wayra: WayraPasarela;
  let manual: ManualPasarela;
  let paypal: PaypalPasarela;
  let qrBancario: QrBancarioPasarela;
  let service: RegistroPasarelasService;

  beforeEach(() => {
    config = {
      get: vi.fn((key: string) => {
        if (key === 'STRIPE_SECRET_KEY') return 'sk_test_123';
        if (key === 'STRIPE_WEBHOOK_SECRET') return 'whsec_123';
        if (key === 'WAYRA_HABILITADO') return 'true';
        return undefined;
      }),
    } as unknown as ConfigService;

    stripe = new PasarelaStripe(config);
    wayra = new WayraPasarela(config);
    manual = new ManualPasarela();
    paypal = new PaypalPasarela(config);
    qrBancario = new QrBancarioPasarela();

    service = new RegistroPasarelasService(stripe, wayra, manual, paypal, qrBancario);
  });

  describe('Catálogo y registro centralizado', () => {
    it('registra las 5 pasarelas base del sistema', () => {
      const lista = service.listar();
      expect(lista).toHaveLength(5);
      const ids = lista.map((p) => p.id);
      expect(ids).toContain('STRIPE');
      expect(ids).toContain('WAYRA');
      expect(ids).toContain('MANUAL');
      expect(ids).toContain('PAYPAL');
      expect(ids).toContain('QR_BANCARIO');
    });

    it('filtra pasarelas por contexto: checkout retail', () => {
      const checkoutList = service.listar({ contexto: 'checkout' });
      const ids = checkoutList.map((p) => p.id);
      expect(ids).toEqual(['STRIPE', 'WAYRA', 'MANUAL']);
      expect(ids).not.toContain('PAYPAL');
      expect(ids).not.toContain('QR_BANCARIO');
    });

    it('filtra pasarelas por contexto: suscripcion SaaS', () => {
      const subList = service.listar({ contexto: 'suscripcion' });
      const ids = subList.map((p) => p.id);
      expect(ids).toEqual(['STRIPE', 'WAYRA', 'PAYPAL', 'QR_BANCARIO']);
      expect(ids).not.toContain('MANUAL');
    });

    it('filtra solo pasarelas disponibles y configuradas', () => {
      const disponibles = service.listar({ contexto: 'suscripcion', soloDisponibles: true });
      const ids = disponibles.map((p) => p.id);
      expect(ids).toEqual(['STRIPE', 'WAYRA']);
      expect(ids).not.toContain('PAYPAL');
      expect(ids).not.toContain('QR_BANCARIO');
    });

    it('obtener pasarela existente retorna la instancia correspondiente', () => {
      expect(service.obtener('STRIPE')).toBe(stripe);
      expect(service.obtener('WAYRA')).toBe(wayra);
      expect(service.obtener('MANUAL')).toBe(manual);
    });

    it('obtener pasarela inexistente lanza PasarelaNoConfiguradaException (HTTP 503)', () => {
      expect(() => service.obtener('INEXISTENTE' as any)).toThrow(PasarelaNoConfiguradaException);
    });
  });

  describe('Validación de disponibilidad (asegurarDisponible)', () => {
    it('permite pasarela disponible y configurada para su contexto', () => {
      expect(service.asegurarDisponible('WAYRA', 'suscripcion')).toBe(wayra);
      expect(service.asegurarDisponible('STRIPE', 'suscripcion')).toBe(stripe);
      expect(service.asegurarDisponible('MANUAL', 'checkout')).toBe(manual);
    });

    it('rechaza pasarela no soportada para el contexto pedido', () => {
      expect(() => service.asegurarDisponible('MANUAL', 'suscripcion')).toThrow(
        /no está habilitada para pago de suscripciones/,
      );
    });

    it('rechaza PayPal sin credenciales con HTTP 503', () => {
      expect(() => service.asegurarDisponible('PAYPAL', 'suscripcion')).toThrow(
        /se encuentra en desarrollo/,
      );
    });

    it('rechaza pasarela en desarrollo (Stub QR Bancario) con HTTP 503', () => {
      expect(() => service.asegurarDisponible('QR_BANCARIO', 'suscripcion')).toThrow(
        /se encuentra en desarrollo/,
      );
    });
  });

  describe('Comportamiento de Stubs (CU45)', () => {
    it('PaypalPasarela sin credenciales informa NO_CONFIGURADA', async () => {
      expect(paypal.metadata.estado).toBe('NO_CONFIGURADA');
      expect(paypal.estaConfigurada()).toBe(false);
      await expect(
        paypal.iniciarCobro({
          montoCents: 1000,
          moneda: 'USD',
          descripcion: 'Prueba',
          referencia: 'ref1',
          contexto: 'suscripcion',
          nombreComercio: 'Tienda',
          urlExito: 'https://exito',
          urlCancelacion: 'https://cancela',
        }),
      ).rejects.toThrow(PasarelaNoConfiguradaException);
    });

    it('QrBancarioPasarela informa estado EN_DESARROLLO y no está configurada', () => {
      expect(qrBancario.metadata.estado).toBe('EN_DESARROLLO');
      expect(qrBancario.estaConfigurada()).toBe(false);
      expect(() =>
        qrBancario.iniciarCobro({
          montoCents: 1000,
          moneda: 'BOB',
          descripcion: 'Prueba',
          referencia: 'ref1',
          contexto: 'suscripcion',
          nombreComercio: 'Tienda',
          urlExito: 'https://exito',
          urlCancelacion: 'https://cancela',
        }),
      ).toThrow(PasarelaNoConfiguradaException);
    });
  });

  describe('ManualPasarela', () => {
    it('iniciarCobro devuelve instrucciones', async () => {
      const res = await manual.iniciarCobro({
        montoCents: 5000,
        moneda: 'BOB',
        descripcion: 'Compra',
        referencia: 'ref_manual',
        contexto: 'checkout',
        nombreComercio: 'Tienda',
        urlExito: 'https://exito',
        urlCancelacion: 'https://cancela',
      });
      expect(res.modo).toBe('INSTRUCCIONES');
      expect(res.instrucciones).toContain('efectivo');
    });

    it('verificarNotificacion lanza excepción porque no tiene webhooks', () => {
      expect(() => manual.verificarNotificacion(Buffer.from(''), {})).toThrow(
        PasarelaNoConfiguradaException,
      );
    });
  });
});
