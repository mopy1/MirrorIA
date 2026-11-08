import { Inject, Injectable, Logger, Optional, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { conTenant, soloTenant } from '../../../core/tenancy/tenant-context.js';
import { VentasService } from '../../ventas/service/ventas.service.js';
import { EstadoPago, MetodoPago, Pago, ProveedorPago } from '../entities/pago.entity.js';
import { PASARELA, type Pasarela } from './pasarela/pasarela.interface.js';

const MINUTOS_TARJETA_POR_DEFECTO = 30;
const MINUTOS_MANUAL_POR_DEFECTO = 1440; // un dia
const VENTAS_POR_BARRIDA = 200;
const MINUTOS_ENTRE_BARRIDAS = 5;

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
 * Se dispara cuando el sistema se usa, a mano desde un endpoint de
 * administracion y, desde 2026-09-29, tambien con un intervalo liviano cada
 * MINUTOS_ENTRE_BARRIDAS: antes un sistema ocioso no liberaba stock hasta que
 * alguien lo usara, y eso dejaba el stock tomado por compras que nadie iba a
 * pagar. Los plazos no cambiaron.
 */
@Injectable()
export class ExpiracionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ExpiracionService.name);
  private barrida: ReturnType<typeof setInterval> | null = null;

  onModuleInit(): void {
    this.barrida = setInterval(() => {
      this.expirarVencidas().catch((err) =>
        this.logger.error(`Barrida de ventas vencidas fallo: ${String(err)}`),
      );
    }, MINUTOS_ENTRE_BARRIDAS * 60_000);
    this.barrida.unref?.();
  }

  onModuleDestroy(): void {
    if (this.barrida) clearInterval(this.barrida);
  }

  constructor(
    @InjectRepository(Pago) private readonly pagoRepository: Repository<Pago>,
    private readonly ventasService: VentasService,
    private readonly config: ConfigService,
    @Inject(PASARELA) private readonly pasarela: Pasarela,
    @Optional() private readonly moduleRef?: ModuleRef,
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
        pago === null || pago.metodo === MetodoPago.TARJETA || pago.metodo === MetodoPago.BILLETERA
          ? this.minutosDeConfig('PAGOS_MINUTOS_VENCIMIENTO', MINUTOS_TARJETA_POR_DEFECTO)
          : this.minutosDeConfig('PAGOS_MINUTOS_VENCIMIENTO_MANUAL', MINUTOS_MANUAL_POR_DEFECTO);

      const desde = pago ? pago.createdAt : venta.createdAt;
      const minutosTranscurridos = (ahora - desde.getTime()) / 60_000;
      if (minutosTranscurridos < limiteMin) continue;

      // Una sesión de tarjeta se cierra antes de cancelar. Si no se puede
      // cerrar es porque la clienta ya pagó (el aviso no llegó, por una caída):
      // cancelar le devolvía el stock a otra y la dejaba pagando sin venta.
      if (pago?.proveedorPago === ProveedorPago.STRIPE && pago.referenciaExterna) {
        if (!(await this.pasarela.cerrarSesion(pago.referenciaExterna))) {
          this.logger.warn(`Venta ${venta.id}: la sesion ${pago.referenciaExterna} no se pudo cerrar, no se cancela`);
          // Si se pagó y el aviso no llegó, se acredita acá: si no, quedaba
          // pendiente para siempre con el stock apartado.
          await this.acreditarSiSePago(venta.tenantId, pago);
          continue;
        }
      }

      try {
        // Barrida global: cada venta se cancela con el tenant de su propia fila.
        await conTenant({ tenantId: venta.tenantId }, () =>
          this.cancelarVenta(venta.id, `pago vencido tras ${limiteMin} minutos`),
        );
        canceladas++;
      } catch (error) {
        // Una venta en un estado raro no puede impedir que las demas liberen su
        // stock. Se anota y se sigue.
        this.logger.warn(`No se pudo expirar la venta ${venta.id}: ${String(error)}`);
      }
    }

    return canceladas;
  }

  private async acreditarSiSePago(tenantId: string, pago: Pago): Promise<void> {
    try {
      // Por ModuleRef para no crear una dependencia circular con PagosService.
      const { PagosService } = await import('./pagos.service.js');
      const pagos = this.moduleRef?.get(PagosService, { strict: false });
      await conTenant({ tenantId }, () => pagos?.acreditarSesionPagada(pago) ?? Promise.resolve());
    } catch (error) {
      this.logger.warn(`No se pudo acreditar la sesion ${pago.referenciaExterna}: ${String(error)}`);
    }
  }

  /**
   * Cancela una venta PENDIENTE sin pagar (vencida, o porque la clienta volvió
   * al carrito): stock, cupón y prendas al carrito los devuelve
   * `VentasService`. Los intentos de cobro quedan RECHAZADO, no se borran: son
   * la constancia de que se intentó. Se marcan TODOS, para que ninguno quede
   * pendiente para siempre en el panel del equipo. update condicionado y no
   * save: un save con el objeto leido antes pisaba lo que un aviso de pago
   * escribio mientras tanto (p. ej. la marca de reembolso de un QR pagado
   * justo al vencer).
   */
  async cancelarVenta(ventaId: string, motivo: string): Promise<void> {
    await this.ventasService.cancelarPorPagoNoCompletado(ventaId, motivo);
    await this.pagoRepository.update(
      soloTenant({ ventaId, estado: EstadoPago.PENDIENTE }),
      { estado: EstadoPago.RECHAZADO },
    );
  }

  /**
   * Cuando vence una venta pagada con tarjeta cuyo intento arranco en `desde`
   * (mismo plazo que usa la barrida): la sesion de Stripe se cierra ahi.
   */
  vencimientoTarjeta(desde: Date): Date {
    const minutos = this.minutosDeConfig('PAGOS_MINUTOS_VENCIMIENTO', MINUTOS_TARJETA_POR_DEFECTO);
    return new Date(desde.getTime() + minutos * 60_000);
  }

  /** Los pagos PENDIENTE de esas ventas, agrupados por venta y del mas viejo al mas nuevo. */
  private async pagosPendientesDe(ventaIds: string[]): Promise<Map<string, Pago[]>> {
    const pagos = await this.pagoRepository.find({
      where: { ventaId: In(ventaIds), estado: EstadoPago.PENDIENTE }, // sin-tenant: ids de la barrida global
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
