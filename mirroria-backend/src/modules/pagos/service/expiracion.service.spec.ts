import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ExpiracionService } from './expiracion.service.js';
import { EstadoPago, MetodoPago, Pago } from '../entities/pago.entity.js';
import type { Venta } from '../../ventas/entities/venta.entity.js';
import type { VentasService } from '../../ventas/service/ventas.service.js';

const AHORA = new Date('2026-09-21T12:00:00Z');

describe('ExpiracionService', () => {
  let pagoRepo: Record<string, ReturnType<typeof vi.fn>>;
  let ventas: {
    findPendientesMasViejasPrimero: ReturnType<typeof vi.fn>;
    cancelarPorPagoNoCompletado: ReturnType<typeof vi.fn>;
  };
  let config: { get: ReturnType<typeof vi.fn> };
  let service: ExpiracionService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(AHORA);
    pagoRepo = { find: vi.fn().mockResolvedValue([]), save: vi.fn((e) => e) };
    ventas = {
      findPendientesMasViejasPrimero: vi.fn().mockResolvedValue([]),
      cancelarPorPagoNoCompletado: vi.fn(),
    };
    config = { get: vi.fn().mockReturnValue(undefined) };
    service = new ExpiracionService(
      pagoRepo as unknown as Repository<Pago>,
      ventas as unknown as VentasService,
      config as unknown as ConfigService,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function hace(minutos: number): Date {
    return new Date(AHORA.getTime() - minutos * 60_000);
  }

  function ventaDeHace(minutos: number): Venta {
    return { id: `v-${minutos}`, createdAt: hace(minutos) } as Venta;
  }

  function pagoDeHace(minutos: number, metodo: MetodoPago): Pago {
    return {
      id: `p-${minutos}`, ventaId: `v-${minutos}`, metodo,
      estado: EstadoPago.PENDIENTE,
      createdAt: hace(minutos),
    } as Pago;
  }

  /**
   * La barrida arranca en `ventas`, no en `pagos`: este helper siembra las dos
   * puntas a la vez a partir de los pagos, que es como estaban escritas las
   * pruebas antes del cambio. La venta se da por creada en el mismo instante
   * que su pago.
   */
  function sembrarConPago(...pagos: Pago[]): void {
    ventas.findPendientesMasViejasPrimero.mockResolvedValue(
      pagos.map((p) => ({ id: p.ventaId, createdAt: p.createdAt }) as Venta),
    );
    pagoRepo.find.mockResolvedValue(pagos);
  }

  it('una tarjeta de hace 10 minutos NO vence: el plazo es de 30', async () => {
    sembrarConPago(pagoDeHace(10, MetodoPago.TARJETA));
    const cuantas = await service.expirarVencidas();
    expect(cuantas).toBe(0);
    expect(ventas.cancelarPorPagoNoCompletado).not.toHaveBeenCalled();
  });

  it('un pago de exactamente 30 minutos ya vence', async () => {
    // Fija la semantica del borde: con "<" 30 vence, con "<=" no. Sin esta
    // prueba, cambiar el operador no rompe nada y el plazo se corre en silencio.
    sembrarConPago(pagoDeHace(30, MetodoPago.TARJETA));
    expect(await service.expirarVencidas()).toBe(1);
  });

  it('una tarjeta de hace 45 minutos vence y devuelve su stock', async () => {
    sembrarConPago(pagoDeHace(45, MetodoPago.TARJETA));
    const cuantas = await service.expirarVencidas();
    expect(cuantas).toBe(1);
    expect(ventas.cancelarPorPagoNoCompletado).toHaveBeenCalledWith(
      'v-45', expect.stringContaining('vencido'),
    );
  });

  it('un cobro en efectivo de hace 45 minutos NO vence: su plazo es de un dia', async () => {
    sembrarConPago(pagoDeHace(45, MetodoPago.EFECTIVO));
    expect(await service.expirarVencidas()).toBe(0);
  });

  it('un cobro por QR de hace dos dias si vence', async () => {
    sembrarConPago(pagoDeHace(2880, MetodoPago.QR));
    expect(await service.expirarVencidas()).toBe(1);
  });

  it('el pago vencido queda RECHAZADO, no se borra', async () => {
    sembrarConPago(pagoDeHace(45, MetodoPago.TARJETA));
    await service.expirarVencidas();
    expect(pagoRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ estado: EstadoPago.RECHAZADO }),
    );
  });

  describe('una venta SIN ninguna fila de pago tambien vence', () => {
    // El defecto: la barrida recorria `pagos`, asi que una venta PENDIENTE que
    // nunca llego a crear un pago era invisible para siempre y su stock y su
    // cupon no volvian jamas. El flujo la produce de forma determinista en un
    // entorno sin claves de Stripe: el checkout crea la venta, descuenta stock,
    // consume el cupon y vacia el carrito, y recien despues `iniciarTarjeta`
    // responde 503.

    it('sin pago se usa el plazo de tarjeta (el corto): a los 45 minutos vence', async () => {
      ventas.findPendientesMasViejasPrimero.mockResolvedValue([ventaDeHace(45)]);
      expect(await service.expirarVencidas()).toBe(1);
      expect(ventas.cancelarPorPagoNoCompletado).toHaveBeenCalledWith(
        'v-45', expect.stringContaining('vencido'),
      );
      // No hay ninguna fila de pago que marcar.
      expect(pagoRepo.save).not.toHaveBeenCalled();
    });

    it('sin pago y dentro del plazo, la venta NO se toca', async () => {
      ventas.findPendientesMasViejasPrimero.mockResolvedValue([ventaDeHace(10)]);
      expect(await service.expirarVencidas()).toBe(0);
      expect(ventas.cancelarPorPagoNoCompletado).not.toHaveBeenCalled();
    });
  });

  it('pide las ventas mas viejas primero: con el tope lleno, no quedan afuera para siempre', async () => {
    // `take: 200` sin `order` deja que Postgres devuelva lo que quiera, y las
    // mas viejas — las que mas tiempo llevan reteniendo stock — podian no
    // entrar nunca en la barrida.
    await service.expirarVencidas();
    expect(ventas.findPendientesMasViejasPrimero).toHaveBeenCalledWith(200);
  });

  it('si no hay ninguna venta pendiente, no se consulta la tabla de pagos', async () => {
    expect(await service.expirarVencidas()).toBe(0);
    expect(pagoRepo.find).not.toHaveBeenCalled();
  });

  it('manda el intento de cobro MAS RECIENTE, no el primero', async () => {
    // Una sesion de tarjeta abandonada hace 45 minutos no puede cancelarle la
    // venta a una clienta que arranco un cobro por QR hace un minuto.
    const tarjetaVieja = { ...pagoDeHace(45, MetodoPago.TARJETA), ventaId: 'v-1' } as Pago;
    const qrReciente = { ...pagoDeHace(1, MetodoPago.QR), ventaId: 'v-1' } as Pago;
    ventas.findPendientesMasViejasPrimero.mockResolvedValue([
      { id: 'v-1', createdAt: hace(60) } as Venta,
    ]);
    pagoRepo.find.mockResolvedValue([tarjetaVieja, qrReciente]);

    expect(await service.expirarVencidas()).toBe(0);
  });

  describe('el plazo se lee de la configuracion sin confiar en ella', () => {
    // `??` solo cubria nulos: con la variable VACIA `Number('')` daba 0 y todo
    // vencia al instante, y con un typo daba NaN, cuya comparacion es siempre
    // falsa, asi que tambien vencia todo. Fallaba abierto por los dos lados, y
    // `.env.example` justamente deja estas variables sin valor.
    const tarjetaDeHace10 = () => pagoDeHace(10, MetodoPago.TARJETA);

    it('con la variable VACIA cae al plazo por defecto (30), no vence a los 10 minutos', async () => {
      config.get.mockReturnValue('');
      sembrarConPago(tarjetaDeHace10());
      expect(await service.expirarVencidas()).toBe(0);
    });

    it('con texto basura cae al plazo por defecto, no vence a los 10 minutos', async () => {
      config.get.mockReturnValue('treinta');
      sembrarConPago(tarjetaDeHace10());
      expect(await service.expirarVencidas()).toBe(0);
    });

    it('con un valor negativo cae al plazo por defecto, no vence a los 10 minutos', async () => {
      config.get.mockReturnValue('-5');
      sembrarConPago(tarjetaDeHace10());
      expect(await service.expirarVencidas()).toBe(0);
    });

    it('un numero valido SI se respeta: con 5 minutos, una tarjeta de hace 10 vence', async () => {
      // El contrapeso de los tres de arriba: si el parseo cayera siempre al
      // valor por defecto, este caso no pasaria.
      config.get.mockReturnValue('5');
      sembrarConPago(tarjetaDeHace10());
      expect(await service.expirarVencidas()).toBe(1);
    });
  });

  it('si cancelar una venta falla, sigue con las demas', async () => {
    // Una venta rota no puede impedir que el resto libere su stock.
    ventas.cancelarPorPagoNoCompletado
      .mockRejectedValueOnce(new Error('esa venta ya estaba cancelada'))
      .mockResolvedValueOnce(undefined);
    sembrarConPago(
      pagoDeHace(45, MetodoPago.TARJETA),
      pagoDeHace(60, MetodoPago.TARJETA),
    );
    expect(await service.expirarVencidas()).toBe(1);
    expect(ventas.cancelarPorPagoNoCompletado).toHaveBeenCalledTimes(2);
  });
});
