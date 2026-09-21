import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { VentasService } from '../../ventas/service/ventas.service.js';
import { EstadoPago, MetodoPago, Pago } from '../entities/pago.entity.js';

const MINUTOS_TARJETA_POR_DEFECTO = 30;
const MINUTOS_MANUAL_POR_DEFECTO = 1440; // un dia
const VENTAS_POR_BARRIDA = 200;

/**
 * Libera el stock de las compras que nunca se pagaron.
 *
 * La barrida parte de `ventas` en estado PENDIENTE, NO de `pagos`. Antes partia
 * de `pagos` y una venta que nunca llego a crear una fila de pago era invisible
 * para siempre: su stock y su cupon no volvian jamas. Y el flujo la produce de
 * forma determinista en un entorno sin claves de Stripe — el checkout crea la
 * venta, descuenta stock, consume el cupon y vacia el carrito, y recien despues
 * `iniciarTarjeta` responde 503.
 *
 * Los plazos son distintos a proposito: una tarjeta se paga en el momento, pero
 * una clienta que va a pagar en la sucursal necesita mas de media hora. Una
 * venta sin ningun pago usa el plazo de tarjeta, el corto: nunca se llego a
 * elegir un metodo, y es el caso del 503 de arriba.
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
    const ventasPendientes =
      await this.ventasService.findPendientesMasViejasPrimero(VENTAS_POR_BARRIDA);
    if (ventasPendientes.length === 0) {
      return 0;
    }

    const pagosPorVenta = await this.pagosPendientesDe(ventasPendientes.map((v) => v.id));
    const ahora = Date.now();
    let canceladas = 0;

    for (const venta of ventasPendientes) {
      const pagos = pagosPorVenta.get(venta.id) ?? [];
      // El intento mas reciente es el que manda: si la clienta acaba de
      // arrancar un cobro por QR, no se le cancela la venta por una sesion de
      // tarjeta que abandono hace media hora.
      const pago = pagos.length > 0 ? pagos[pagos.length - 1] : null;

      // Sin ningun pago no se llego a elegir metodo (el caso del 503 de la
      // pasarela): se usa el plazo corto, el de tarjeta. Con pago, el plazo
      // sigue dependiendo del metodo y el reloj arranca en el intento de pago,
      // no en el checkout.
      const limiteMin =
        pago === null || pago.metodo === MetodoPago.TARJETA
          ? this.minutosDeConfig('PAGOS_MINUTOS_VENCIMIENTO', MINUTOS_TARJETA_POR_DEFECTO)
          : this.minutosDeConfig('PAGOS_MINUTOS_VENCIMIENTO_MANUAL', MINUTOS_MANUAL_POR_DEFECTO);

      const desde = pago ? pago.createdAt : venta.createdAt;
      const minutosTranscurridos = (ahora - desde.getTime()) / 60_000;
      if (minutosTranscurridos < limiteMin) continue;

      try {
        await this.ventasService.cancelarPorPagoNoCompletado(
          venta.id,
          `pago vencido tras ${limiteMin} minutos`,
        );
        // Los intentos de cobro de una venta cancelada quedan RECHAZADO, no se
        // borran: son la constancia de que se intento. Se marcan TODOS, para
        // que ninguno quede pendiente para siempre en el panel del equipo.
        for (const pendiente of pagos) {
          pendiente.estado = EstadoPago.RECHAZADO;
          await this.pagoRepository.save(pendiente);
        }
        canceladas++;
      } catch (error) {
        // Una venta en un estado raro no puede impedir que las demas liberen su
        // stock. Se anota y se sigue.
        this.logger.warn(`No se pudo expirar la venta ${venta.id}: ${String(error)}`);
      }
    }

    return canceladas;
  }

  /** Los pagos PENDIENTE de esas ventas, agrupados por venta y del mas viejo al mas nuevo. */
  private async pagosPendientesDe(ventaIds: string[]): Promise<Map<string, Pago[]>> {
    const pagos = await this.pagoRepository.find({
      where: { ventaId: In(ventaIds), estado: EstadoPago.PENDIENTE },
      order: { createdAt: 'ASC' },
    });
    const porVenta = new Map<string, Pago[]>();
    for (const pago of pagos) {
      const lista = porVenta.get(pago.ventaId);
      if (lista) {
        lista.push(pago);
      } else {
        porVenta.set(pago.ventaId, [pago]);
      }
    }
    return porVenta;
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
