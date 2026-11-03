import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomInt, randomUUID } from 'node:crypto';
import type {
  CobroWayraResponseDto,
  ComprobanteWayraResponseDto,
  CuentaWayraDto,
  PagarWayraDto,
} from '../../dto/wayra.dto.js';
import { RecursoNoEncontradoException } from '../../../../core/exception/recurso-no-encontrado.exception.js';
import { CobroQrNoPagableException } from '../../exception/cobro-qr-no-pagable.exception.js';
import type { AvisoPagoQr } from '../qr/aviso-pago-qr.js';
import { COMERCIO_QR, CobroQrService } from '../qr/cobro-qr.service.js';
import { firmarAviso, secretoAvisosQr } from '../qr/firma-aviso.js';

/** Las cuentas de la persona que paga. Ficticias: Wayra no existe. */
export const CUENTAS_WAYRA: readonly CuentaWayraDto[] = [
  {
    id: 'ahorro',
    tipo: 'Caja de ahorro',
    numeroEnmascarado: '•••• 4821',
    saldoCents: 875_000,
  },
  {
    id: 'corriente',
    tipo: 'Cuenta corriente',
    numeroEnmascarado: '•••• 0937',
    saldoCents: 2_431_050,
  },
];
const TITULAR = 'Cliente de prueba';

/**
 * WAYRA — el banco SIMULADO de la demo. Hace lo que haria la app de un banco
 * real al escanear un QR de cobro: muestra a quien se le paga y cuanto, debita
 * de una cuenta y le AVISA al comercio con un mensaje firmado.
 *
 * No mueve dinero real ni guarda cuentas: el saldo es fijo y el PIN acepta
 * cualquier combinacion de 4 digitos. Vive en este backend solo porque no hay
 * otro lugar donde hostearlo; habla con `CobroQrService` exactamente como lo
 * haria un banco externo (aviso firmado), y por eso se puede reemplazar por
 * uno real sin tocar el lado del comercio.
 */
@Injectable()
export class WayraBancoService {
  constructor(
    private readonly cobroQrService: CobroQrService,
    private readonly config: ConfigService,
  ) {}

  async verCobro(token: string): Promise<CobroWayraResponseDto> {
    this.exigirHabilitado();
    const cobro = await this.cobroQrService.consultarPorToken(token);
    return {
      comercio: COMERCIO_QR,
      glosa: `Compra ${cobro.referencia}`,
      referencia: cobro.referencia,
      montoCents: cobro.montoCents,
      estado: cobro.estado,
      transaccion: cobro.transaccion,
      pagadoEn: cobro.pagadoEn,
      titular: TITULAR,
      cuentas: [...CUENTAS_WAYRA],
    };
  }

  async pagar(
    token: string,
    dto: PagarWayraDto,
  ): Promise<ComprobanteWayraResponseDto> {
    this.exigirHabilitado();
    const cuenta = CUENTAS_WAYRA.find((c) => c.id === dto.cuenta);
    if (!cuenta) {
      throw new CobroQrNoPagableException('la cuenta elegida no existe');
    }
    const cobro = await this.cobroQrService.consultarPorToken(token);
    if (cobro.estado === 'PAGADO') {
      throw new CobroQrNoPagableException('ya fue pagado');
    }
    if (cobro.estado === 'VENCIDO') {
      throw new CobroQrNoPagableException('la compra vencio');
    }
    if (cobro.montoCents > cuenta.saldoCents) {
      throw new CobroQrNoPagableException(
        'saldo insuficiente en la cuenta elegida',
      );
    }

    const pagadoEn = new Date();
    const aviso: AvisoPagoQr = {
      id: `evt_${randomUUID()}`,
      tipo: 'cobro_qr.pagado',
      token,
      transaccion: numeroDeTransaccion(pagadoEn),
      montoCents: cobro.montoCents,
      pagadoEn: pagadoEn.toISOString(),
    };
    // Un banco real haria un POST a /pagos/qr/aviso con este cuerpo y esta
    // firma. Aca va directo al mismo metodo que atiende ese endpoint.
    const cuerpo = Buffer.from(JSON.stringify(aviso), 'utf8');
    const firma = firmarAviso(cuerpo, secretoAvisosQr(this.config));
    const { procesado } = await this.cobroQrService.procesarAviso(
      cuerpo,
      firma,
    );
    if (!procesado) {
      throw new CobroQrNoPagableException(
        'el comercio no pudo acreditar el pago',
      );
    }

    return {
      transaccion: aviso.transaccion,
      comercio: COMERCIO_QR,
      glosa: `Compra ${cobro.referencia}`,
      referencia: cobro.referencia,
      montoCents: cobro.montoCents,
      cuentaOrigen: `${cuenta.tipo} ${cuenta.numeroEnmascarado}`,
      titular: TITULAR,
      pagadoEn,
    };
  }

  /**
   * Wayra paga sin dinero real: el dia que haya una pasarela de verdad, dejarlo
   * prendido seria una puerta para "pagar" cualquier compra gratis. Con
   * WAYRA_HABILITADO=false sus rutas responden 404. Prendido por defecto porque
   * hoy es la unica forma de pagar con QR en la demo.
   */
  private exigirHabilitado(): void {
    if (this.config.get<string>('WAYRA_HABILITADO') === 'false') {
      throw new RecursoNoEncontradoException('Banco simulado Wayra');
    }
  }
}

/** `WY261026` + 8 digitos al azar: fecha del dia y un correlativo. */
function numeroDeTransaccion(fecha: Date): string {
  const aa = String(fecha.getFullYear()).slice(2);
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  return `WY${aa}${mm}${dd}${String(randomInt(0, 100_000_000)).padStart(8, '0')}`;
}
