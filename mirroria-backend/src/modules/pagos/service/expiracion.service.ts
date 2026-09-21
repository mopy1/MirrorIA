import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VentasService } from '../../ventas/service/ventas.service.js';
import { EstadoPago, MetodoPago, Pago } from '../entities/pago.entity.js';

const MINUTOS_TARJETA_POR_DEFECTO = 30;
const MINUTOS_MANUAL_POR_DEFECTO = 1440; // un dia

/**
 * Libera el stock de las compras que nunca se pagaron.
 *
 * Los plazos son distintos a proposito: una tarjeta se paga en el momento, pero
 * una clienta que va a pagar en la sucursal necesita mas de media hora.
 *
 * No hay planificador: esto se dispara cuando el sistema se usa, y tambien a
 * mano desde un endpoint de administracion. Un sistema ocioso no libera stock
 * hasta que alguien lo use — costo aceptado y declarado en el spec.
 */
@Injectable()
export class ExpiracionService {
  private readonly logger = new Logger(ExpiracionService.name);

  constructor(
    @InjectRepository(Pago) private readonly pagoRepository: Repository<Pago>,
    private readonly ventasService: VentasService,
    private readonly config: ConfigService,
  ) {}

  async expirarVencidas(): Promise<number> {
    const pendientes = await this.pagoRepository.find({
      where: { estado: EstadoPago.PENDIENTE },
      take: 200,
    });

    const ahora = Date.now();
    let canceladas = 0;

    for (const pago of pendientes) {
      const limiteMin =
        pago.metodo === MetodoPago.TARJETA
          ? this.minutosDeConfig('PAGOS_MINUTOS_VENCIMIENTO', MINUTOS_TARJETA_POR_DEFECTO)
          : this.minutosDeConfig('PAGOS_MINUTOS_VENCIMIENTO_MANUAL', MINUTOS_MANUAL_POR_DEFECTO);

      const minutosTranscurridos = (ahora - pago.createdAt.getTime()) / 60_000;
      if (minutosTranscurridos < limiteMin) continue;

      try {
        await this.ventasService.cancelarPorPagoNoCompletado(
          pago.ventaId,
          `pago vencido tras ${limiteMin} minutos`,
        );
        pago.estado = EstadoPago.RECHAZADO;
        await this.pagoRepository.save(pago);
        canceladas++;
      } catch (error) {
        // Una venta en un estado raro no puede impedir que las demas liberen su
        // stock. Se anota y se sigue.
        this.logger.warn(`No se pudo expirar la venta ${pago.ventaId}: ${String(error)}`);
      }
    }

    return canceladas;
  }

  /**
   * Lee un plazo en minutos de la configuracion sin confiar en ella.
   *
   * `??` solo cubre null/undefined, y esa era justo la trampa: con la variable
   * VACIA (que es como la deja `.env.example`) `Number('')` da 0 y todo vence
   * al instante; con un typo da NaN y, como toda comparacion con NaN es falsa,
   * tambien vence todo. Falla abierto por los dos lados. Aca el valor se usa
   * solo si es un numero finito y positivo; cualquier otra cosa cae al valor
   * por defecto.
   */
  private minutosDeConfig(clave: string, porDefecto: number): number {
    const crudo = this.config.get(clave);
    if (crudo === null || crudo === undefined || crudo === '') {
      return porDefecto;
    }
    const valor = Number(crudo);
    if (!Number.isFinite(valor) || valor <= 0) {
      this.logger.warn(
        `${clave} tiene un valor invalido (${String(crudo)}): se usa el plazo por defecto de ${porDefecto} minutos`,
      );
      return porDefecto;
    }
    return valor;
  }
}
