import type { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CobroQrNoPagableException } from '../../exception/cobro-qr-no-pagable.exception.js';
import type { CobroQrPublico, CobroQrService } from '../qr/cobro-qr.service.js';
import { firmaAvisoValida, secretoAvisosQr } from '../qr/firma-aviso.js';
import { WayraBancoService } from './wayra-banco.service.js';

describe('WayraBancoService (banco simulado)', () => {
  let wayra: WayraBancoService;
  let cobroQr: {
    consultarPorToken: ReturnType<typeof vi.fn>;
    procesarAviso: ReturnType<typeof vi.fn>;
  };
  const config = {
    get: vi.fn((k: string) => (k === 'JWT_SECRET' ? 's' : undefined)),
  } as unknown as ConfigService;

  const pendiente: CobroQrPublico = {
    montoCents: 24500,
    referencia: '#8F3A1C9E',
    estado: 'PENDIENTE',
    transaccion: null,
    pagadoEn: null,
  };

  beforeEach(() => {
    cobroQr = {
      consultarPorToken: vi.fn().mockResolvedValue(pendiente),
      procesarAviso: vi.fn().mockResolvedValue({ procesado: true }),
    };
    wayra = new WayraBancoService(cobroQr as unknown as CobroQrService, config);
  });

  it('al escanear muestra comercio, glosa, monto y las cuentas de prueba', async () => {
    const res = await wayra.verCobro('tok');
    expect(res).toMatchObject({
      comercio: 'MirrorIA',
      glosa: 'Compra #8F3A1C9E',
      montoCents: 24500,
    });
    expect(res.cuentas.length).toBeGreaterThan(0);
  });

  it('pagar le avisa al comercio con un mensaje FIRMADO y devuelve el comprobante', async () => {
    const comprobante = await wayra.pagar('tok', {
      cuenta: 'ahorro',
      pin: '1234',
    });
    expect(comprobante.transaccion).toMatch(/^WY\d{14}$/);
    expect(comprobante.cuentaOrigen).toContain('4821');

    const [cuerpo, firma] = cobroQr.procesarAviso.mock.calls[0] as [
      Buffer,
      string,
    ];
    expect(firmaAvisoValida(cuerpo, firma, secretoAvisosQr(config))).toBe(true);
    expect(JSON.parse(cuerpo.toString())).toMatchObject({
      tipo: 'cobro_qr.pagado',
      token: 'tok',
      montoCents: 24500,
      transaccion: comprobante.transaccion,
    });
  });

  it('un QR ya pagado no se vuelve a pagar', async () => {
    cobroQr.consultarPorToken.mockResolvedValue({
      ...pendiente,
      estado: 'PAGADO',
    });
    await expect(
      wayra.pagar('tok', { cuenta: 'ahorro', pin: '1234' }),
    ).rejects.toThrow(/ya fue pagado/);
    expect(cobroQr.procesarAviso).not.toHaveBeenCalled();
  });

  it('un QR vencido no se puede pagar', async () => {
    cobroQr.consultarPorToken.mockResolvedValue({
      ...pendiente,
      estado: 'VENCIDO',
    });
    await expect(
      wayra.pagar('tok', { cuenta: 'ahorro', pin: '1234' }),
    ).rejects.toThrow(/vencio/);
  });

  it('sin saldo suficiente el banco rechaza antes de avisar', async () => {
    cobroQr.consultarPorToken.mockResolvedValue({
      ...pendiente,
      montoCents: 99_999_999,
    });
    await expect(
      wayra.pagar('tok', { cuenta: 'ahorro', pin: '1234' }),
    ).rejects.toThrow(/saldo insuficiente/);
    expect(cobroQr.procesarAviso).not.toHaveBeenCalled();
  });

  it('si el comercio no lo acredita, no se muestra un comprobante falso', async () => {
    cobroQr.procesarAviso.mockResolvedValue({ procesado: false });
    await expect(
      wayra.pagar('tok', { cuenta: 'ahorro', pin: '1234' }),
    ).rejects.toThrow(CobroQrNoPagableException);
  });

  it('una cuenta que no existe se rechaza', async () => {
    await expect(
      wayra.pagar('tok', { cuenta: 'otra', pin: '1234' }),
    ).rejects.toThrow(/no existe/);
  });

  it('con WAYRA_HABILITADO=false el banco simulado no existe (404)', async () => {
    const apagado = {
      get: vi.fn((k: string) =>
        k === 'WAYRA_HABILITADO' ? 'false' : k === 'JWT_SECRET' ? 's' : undefined,
      ),
    } as unknown as ConfigService;
    const w = new WayraBancoService(cobroQr as unknown as CobroQrService, apagado);
    await expect(w.verCobro('tok')).rejects.toThrow(/no encontrado/);
    await expect(w.pagar('tok', { cuenta: 'ahorro', pin: '1234' })).rejects.toThrow(
      /no encontrado/,
    );
    expect(cobroQr.procesarAviso).not.toHaveBeenCalled();
  });
});
