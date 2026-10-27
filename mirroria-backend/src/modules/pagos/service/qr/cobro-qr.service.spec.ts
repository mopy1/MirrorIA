import type { ConfigService } from '@nestjs/config';
import type { DataSource, Repository } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JwtPayload } from '../../../../core/security/jwt-payload.interface.js';
import type { VentasService } from '../../../ventas/service/ventas.service.js';
import {
  EstadoPago,
  MetodoPago,
  type Pago,
  ProveedorPago,
} from '../../entities/pago.entity.js';
import { FirmaWebhookInvalidaException } from '../../exception/firma-webhook-invalida.exception.js';
import { OperacionInvalidaException } from '../../../../core/exception/operacion-invalida.exception.js';
import { VentaNoPagableException } from '../../exception/venta-no-pagable.exception.js';
import type { ExpiracionService } from '../expiracion.service.js';
import type { AvisoPagoQr } from './aviso-pago-qr.js';
import { CobroQrService } from './cobro-qr.service.js';
import { firmarAviso, secretoAvisosQr } from './firma-aviso.js';

const DUENO = {
  sub: 'cli1',
  email: 'c@x',
  rol: 'CLIENTE',
} as unknown as JwtPayload;
const VENTA_ID = '8f3a1c9e-4b2d-4c1a-9e7f-0a1b2c3d4e5f';

describe('CobroQrService', () => {
  let service: CobroQrService;
  let pagoRepo: {
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let pagoRepoTx: {
    save: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let ventas: {
    findOne: ReturnType<typeof vi.fn>;
    marcarPagada: ReturnType<typeof vi.fn>;
  };
  let config: ConfigService;
  const valores: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of Object.keys(valores)) delete valores[k];
    valores.JWT_SECRET = 'secreto-de-prueba';
    valores.PAGOS_URL_EXITO = 'https://mirroria.duckdns.org/pago/exito';
    config = {
      get: vi.fn((k: string) => valores[k]),
    } as unknown as ConfigService;

    pagoRepo = {
      create: vi.fn((e) => e),
      save: vi.fn((e) => Promise.resolve({ id: 'p1', ...e })),
      findOne: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
    };
    pagoRepoTx = {
      save: vi.fn((e) => Promise.resolve(e)),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
    };
    ventas = {
      findOne: vi.fn().mockResolvedValue({
        id: VENTA_ID,
        clienteId: 'cli1',
        estado: 'PENDIENTE',
        totalCents: 24500,
      }),
      marcarPagada: vi.fn(),
    };
    const dataSource = {
      transaction: (cb: (m: unknown) => unknown) =>
        cb({ getRepository: () => pagoRepoTx }),
    } as unknown as DataSource;
    service = new CobroQrService(
      pagoRepo as unknown as Repository<Pago>,
      dataSource,
      ventas as unknown as VentasService,
      config,
      {
        expirarVencidas: vi.fn().mockResolvedValue(0),
      } as unknown as ExpiracionService,
    );
  });

  function pendiente(extra: Partial<Pago> = {}): Pago {
    return {
      id: 'p1',
      ventaId: VENTA_ID,
      proveedorPago: ProveedorPago.WAYRA,
      metodo: MetodoPago.QR,
      montoCents: 24500,
      estado: EstadoPago.PENDIENTE,
      eventId: 'qr:tok',
      referenciaExterna: 'tok',
      updatedAt: new Date('2026-10-26T15:00:00Z'),
      ...extra,
    } as Pago;
  }

  function avisoFirmado(extra: Partial<AvisoPagoQr> = {}): {
    cuerpo: Buffer;
    firma: string;
  } {
    const aviso: AvisoPagoQr = {
      id: 'evt_1',
      tipo: 'cobro_qr.pagado',
      token: 'tok',
      transaccion: 'WY261026000123',
      montoCents: 24500,
      pagadoEn: '2026-10-26T15:00:00Z',
      ...extra,
    };
    const cuerpo = Buffer.from(JSON.stringify(aviso));
    return { cuerpo, firma: firmarAviso(cuerpo, secretoAvisosQr(config)) };
  }

  describe('iniciar', () => {
    it('genera un QR por compra, con su monto, y una imagen lista para mostrar', async () => {
      const res = await service.iniciar(VENTA_ID, DUENO);
      expect(res.montoCents).toBe(24500);
      expect(res.referencia).toBe('#8F3A1C9E');
      expect(res.comercio).toBe('MirrorIA');
      expect(res.qrImagen).toMatch(/^data:image\/png;base64,/);
      expect(pagoRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          proveedorPago: ProveedorPago.WAYRA,
          metodo: MetodoPago.QR,
          estado: EstadoPago.PENDIENTE,
        }),
      );
    });

    it('el QR lleva al dominio publico de la tienda, sacado de PAGOS_URL_EXITO', async () => {
      const res = await service.iniciar(VENTA_ID, DUENO);
      expect(res.qrContenido).toMatch(
        /^https:\/\/mirroria\.duckdns\.org\/wayra\/pagar\/[\w-]{20,}$/,
      );
    });

    it('WAYRA_URL_BASE manda sobre PAGOS_URL_EXITO', async () => {
      valores.WAYRA_URL_BASE = 'http://192.168.1.50:5174/';
      const res = await service.iniciar(VENTA_ID, DUENO);
      expect(
        res.qrContenido.startsWith('http://192.168.1.50:5174/wayra/pagar/'),
      ).toBe(true);
    });

    it('cada QR nuevo tiene un token distinto y no adivinable', async () => {
      await service.iniciar(VENTA_ID, DUENO);
      await service.iniciar(VENTA_ID, DUENO);
      const [a, b] = pagoRepo.save.mock.calls.map(
        (c) => (c[0] as Pago).referenciaExterna,
      );
      expect(a).not.toBe(b);
      expect(a?.length).toBeGreaterThanOrEqual(24);
    });

    it('un QR pendiente con otro monto se descarta y se genera uno nuevo', async () => {
      pagoRepo.findOne.mockResolvedValue(pendiente({ montoCents: 100 }));
      const res = await service.iniciar(VENTA_ID, DUENO);
      expect(pagoRepo.update).toHaveBeenCalledWith(
        { id: 'p1', estado: EstadoPago.PENDIENTE },
        { estado: EstadoPago.RECHAZADO },
      );
      expect(res.montoCents).toBe(24500);
      expect(res.qrContenido.endsWith('/wayra/pagar/tok')).toBe(false);
    });

    it('recargar la pantalla reutiliza el QR pendiente en vez de crear otro', async () => {
      pagoRepo.findOne.mockResolvedValue(pendiente());
      const res = await service.iniciar(VENTA_ID, DUENO);
      expect(pagoRepo.save).not.toHaveBeenCalled();
      expect(res.qrContenido.endsWith('/wayra/pagar/tok')).toBe(true);
    });

    it('nadie genera el QR de una compra ajena', async () => {
      ventas.findOne.mockResolvedValue({
        id: VENTA_ID,
        clienteId: 'OTRA',
        estado: 'PENDIENTE',
        totalCents: 1,
      });
      await expect(service.iniciar(VENTA_ID, DUENO)).rejects.toThrow();
      expect(pagoRepo.save).not.toHaveBeenCalled();
    });

    it('una compra que ya no esta pendiente no genera QR', async () => {
      ventas.findOne.mockResolvedValue({
        id: VENTA_ID,
        clienteId: 'cli1',
        estado: 'CANCELADA',
        totalCents: 1,
      });
      await expect(service.iniciar(VENTA_ID, DUENO)).rejects.toThrow(
        VentaNoPagableException,
      );
    });
  });

  describe('procesarAviso', () => {
    beforeEach(() => pagoRepo.findOne.mockResolvedValue(pendiente()));

    it('un aviso firmado aprueba el pago y cobra la venta en la misma transaccion', async () => {
      const { cuerpo, firma } = avisoFirmado();
      await expect(service.procesarAviso(cuerpo, firma)).resolves.toEqual({
        procesado: true,
      });
      // Aprobado con un UPDATE condicionado a PENDIENTE (ver concurrencia).
      expect(pagoRepoTx.update).toHaveBeenCalledWith(
        { id: 'p1', estado: EstadoPago.PENDIENTE },
        {
          estado: EstadoPago.APROBADO,
          eventId: `wayra:WY261026000123@${Date.parse('2026-10-26T15:00:00Z')}`,
        },
      );
      expect(ventas.marcarPagada).toHaveBeenCalledWith(
        VENTA_ID,
        expect.anything(),
      );
    });

    it('cierra los otros intentos pendientes de la misma venta (ej. efectivo)', async () => {
      const { cuerpo, firma } = avisoFirmado();
      await service.procesarAviso(cuerpo, firma);
      expect(pagoRepoTx.update).toHaveBeenCalledWith(
        expect.objectContaining({
          ventaId: VENTA_ID,
          estado: EstadoPago.PENDIENTE,
        }),
        { estado: EstadoPago.RECHAZADO },
      );
    });

    it('una firma falsa no toca nada', async () => {
      const { cuerpo } = avisoFirmado();
      await expect(
        service.procesarAviso(cuerpo, 'ab'.repeat(32)),
      ).rejects.toThrow(FirmaWebhookInvalidaException);
      expect(ventas.marcarPagada).not.toHaveBeenCalled();
    });

    it('un cuerpo alterado despues de firmar no pasa', async () => {
      const { firma } = avisoFirmado();
      const alterado = Buffer.from(
        JSON.stringify({
          ...JSON.parse(avisoFirmado().cuerpo.toString()),
          montoCents: 1,
        }),
      );
      await expect(service.procesarAviso(alterado, firma)).rejects.toThrow(
        FirmaWebhookInvalidaException,
      );
    });

    it('un aviso repetido sobre un QR ya pagado no cobra dos veces', async () => {
      pagoRepo.findOne.mockResolvedValue(
        pendiente({ estado: EstadoPago.APROBADO }),
      );
      const { cuerpo, firma } = avisoFirmado();
      await expect(service.procesarAviso(cuerpo, firma)).resolves.toEqual({
        procesado: false,
      });
      expect(ventas.marcarPagada).not.toHaveBeenCalled();
    });

    it('un aviso por un monto distinto al del QR no se acredita', async () => {
      const { cuerpo, firma } = avisoFirmado({ montoCents: 100 });
      await expect(service.procesarAviso(cuerpo, firma)).resolves.toEqual({
        procesado: false,
      });
      expect(ventas.marcarPagada).not.toHaveBeenCalled();
    });

    it('si la venta ya no se puede cobrar, el pago queda RECHAZADO y marcado para reembolso', async () => {
      ventas.marcarPagada.mockRejectedValue(
        new OperacionInvalidaException('No se puede cobrar una venta en estado CANCELADA'),
      );
      const { cuerpo, firma } = avisoFirmado();
      await expect(service.procesarAviso(cuerpo, firma)).resolves.toEqual({
        procesado: false,
      });
      expect(pagoRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'p1' }),
        expect.objectContaining({
          estado: EstadoPago.RECHAZADO,
          motivoReembolso: expect.stringContaining('reembolso'),
        }),
      );
    });

    it('dos avisos simultaneos sobre el mismo QR: solo el primero acredita', async () => {
      // El segundo llega cuando el primero ya paso el pago a APROBADO: el
      // UPDATE condicionado a PENDIENTE no afecta ninguna fila.
      pagoRepoTx.update.mockResolvedValueOnce({ affected: 0 });
      const { cuerpo, firma } = avisoFirmado({ transaccion: 'WY26102600000002' });
      await expect(service.procesarAviso(cuerpo, firma)).resolves.toEqual({
        procesado: false,
      });
      expect(ventas.marcarPagada).not.toHaveBeenCalled();
    });

    it('un error de la base que NO es "venta cancelada" se propaga y no inventa un reembolso', async () => {
      ventas.marcarPagada.mockRejectedValue(new Error('connection terminated'));
      const { cuerpo, firma } = avisoFirmado();
      await expect(service.procesarAviso(cuerpo, firma)).rejects.toThrow(
        'connection terminated',
      );
      expect(pagoRepo.update).not.toHaveBeenCalled();
    });

    it('un aviso de otro tipo se ignora', async () => {
      const { cuerpo, firma } = avisoFirmado({
        tipo: 'cobro_qr.otro' as AvisoPagoQr['tipo'],
      });
      await expect(service.procesarAviso(cuerpo, firma)).resolves.toEqual({
        procesado: false,
      });
      expect(ventas.marcarPagada).not.toHaveBeenCalled();
    });
  });

  describe('estado', () => {
    it('si la compra se pago por otro lado, este QR no dice "vencio"', async () => {
      pagoRepo.findOne.mockResolvedValue(
        pendiente({ estado: EstadoPago.RECHAZADO }),
      );
      ventas.findOne.mockResolvedValue({
        id: VENTA_ID,
        clienteId: 'cli1',
        estado: 'PAGADA',
        totalCents: 24500,
      });
      const res = await service.consultarPorToken('tok');
      expect(res.estado).toBe('PAGADO');
    });

    it('un QR aprobado se ve PAGADO con su transaccion y la hora DEL BANCO, no updatedAt', async () => {
      const ms = Date.parse('2026-10-26T20:16:02Z');
      pagoRepo.findOne.mockResolvedValue(
        pendiente({
          estado: EstadoPago.APROBADO,
          eventId: `wayra:WY261026000123@${ms}`,
        }),
      );
      const res = await service.estadoParaLaClienta('p1', DUENO);
      expect(res).toMatchObject({
        estado: 'PAGADO',
        transaccion: 'WY261026000123',
      });
      expect(res.pagadoEn?.getTime()).toBe(ms);
    });

    it('un QR pendiente sobre una venta cancelada se ve VENCIDO', async () => {
      pagoRepo.findOne.mockResolvedValue(pendiente());
      ventas.findOne.mockResolvedValue({
        id: VENTA_ID,
        clienteId: 'cli1',
        estado: 'CANCELADA',
        totalCents: 1,
      });
      const res = await service.consultarPorToken('tok');
      expect(res.estado).toBe('VENCIDO');
    });

    it('un token desconocido es 404', async () => {
      pagoRepo.findOne.mockResolvedValue(null);
      await expect(service.consultarPorToken('nada')).rejects.toThrow(
        /no encontrado/,
      );
    });
  });
});
