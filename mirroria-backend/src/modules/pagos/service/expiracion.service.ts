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
          ? Number(this.config.get('PAGOS_MINUTOS_VENCIMIENTO') ?? MINUTOS_TARJETA_POR_DEFECTO)
          : Number(this.config.get('PAGOS_MINUTOS_VENCIMIENTO_MANUAL') ?? MINUTOS_MANUAL_POR_DEFECTO);

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
}
