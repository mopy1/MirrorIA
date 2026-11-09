import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import type { DataSource, EntityManager } from 'typeorm';
import { In, LessThan, MoreThanOrEqual, Repository } from 'typeorm';
import { ForbiddenActionException } from '../../../core/exception/forbidden-action.exception.js';
import { OperacionInvalidaException } from '../../../core/exception/operacion-invalida.exception.js';
import { RecursoNoEncontradoException } from '../../../core/exception/recurso-no-encontrado.exception.js';
import { StockInsuficienteException } from '../../../core/exception/stock-insuficiente.exception.js';
import { conTenant, soloTenant, tenantActual } from '../../../core/tenancy/tenant-context.js';
import { ProductosService } from '../../catalogo/service/productos.service.js';
import { TipoMovimientoInventario } from '../../inventario/entities/movimiento-inventario.entity.js';
import { InventarioSucursalService } from '../../inventario/service/inventario-sucursal.service.js';
import { SucursalesService } from '../../sucursales/service/sucursales.service.js';
import type { CreateReservaDto } from '../dto/create-reserva.dto.js';
import type { CupoReservaResponseDto } from '../dto/cupo-reserva-response.dto.js';
import { MINUTOS_ENTRE_BARRIDAS, REGLAS_RESERVA } from '../reglas-reserva.js';
import type { ReservaResponseDto } from '../dto/reserva-response.dto.js';
import { EstadoReserva, Reserva } from '../entities/reserva.entity.js';
import { ReservaItem } from '../entities/reserva-item.entity.js';

// Transiciones manuales permitidas (staff). COMPLETADA se llega solo vía
// completarPorVenta — nunca desde acá. Cualquier estado no listado como
// origen es terminal (no admite más transiciones).
const TRANSICIONES_MANUALES: Partial<Record<EstadoReserva, EstadoReserva[]>> = {
  // EN_TIENDA directo desde PENDIENTE: si la clienta llega antes de que la
  // tienda confirmara, el personal no tiene que hacer dos pasos.
  [EstadoReserva.PENDIENTE]: [
    EstadoReserva.CONFIRMADA,
    EstadoReserva.EN_TIENDA,
    EstadoReserva.CANCELADA,
    EstadoReserva.EXPIRADA,
  ],
  [EstadoReserva.CONFIRMADA]: [
    EstadoReserva.EN_TIENDA,
    EstadoReserva.CANCELADA,
    EstadoReserva.EXPIRADA,
    EstadoReserva.NO_SHOW,
  ],
  // Se probó y no compró: antes EN_TIENDA solo salía con una venta y el stock
  // quedaba reservado para siempre. CANCELADA libera el stock y no es falta.
  [EstadoReserva.EN_TIENDA]: [EstadoReserva.CANCELADA],
};

const ESTADOS_ACTIVOS = [
  EstadoReserva.PENDIENTE,
  EstadoReserva.CONFIRMADA,
  EstadoReserva.EN_TIENDA,
];

// "Reservó y no vino": vencida sola o marcada no-show por la tienda.
const ESTADOS_FALTA = [EstadoReserva.EXPIRADA, EstadoReserva.NO_SHOW];

const MS_MINUTO = 60_000;
const MS_DIA = 24 * 60 * MS_MINUTO;

const ESTADOS_QUE_LIBERAN_STOCK = [
  EstadoReserva.CANCELADA,
  EstadoReserva.EXPIRADA,
  EstadoReserva.NO_SHOW,
  EstadoReserva.COMPLETADA,
];

@Injectable()
export class ReservasService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReservasService.name);
  private barrida: ReturnType<typeof setInterval> | null = null;

  constructor(
    @InjectRepository(Reserva)
    private readonly reservaRepository: Repository<Reserva>,
    @InjectRepository(ReservaItem)
    private readonly reservaItemRepository: Repository<ReservaItem>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly sucursalesService: SucursalesService,
    private readonly productosService: ProductosService,
    private readonly inventarioSucursalService: InventarioSucursalService,
  ) {}

  // Sin planificador externo: un intervalo liviano en el propio proceso libera
  // las reservas vencidas aunque nadie use el sistema, y además se barre en
  // cada consulta de reservas (por si el proceso se reinició hace poco).
  onModuleInit(): void {
    this.barrida = setInterval(() => {
      this.expirarVencidas().catch((err) =>
        this.logger.error(`Barrida de reservas vencidas falló: ${String(err)}`),
      );
    }, MINUTOS_ENTRE_BARRIDAS * MS_MINUTO);
    this.barrida.unref?.();
  }

  onModuleDestroy(): void {
    if (this.barrida) clearInterval(this.barrida);
  }

  // RF09/RF10: el cliente selecciona varias prendas y las reserva en una
  // sucursal — reserva stock (cantidadReservada) sin todavía descontarlo
  // físicamente (eso pasa recién si se concreta en una venta).
  async create(dto: CreateReservaDto, clienteId: string): Promise<ReservaResponseDto> {
    await this.expirarVencidas();
    this.validarHorario(new Date(dto.fechaHoraPrevista));
    const variantes = new Set(dto.items.map((i) => i.varianteId));
    if (variantes.size !== dto.items.length) {
      throw new OperacionInvalidaException(
        'La misma prenda (talla y color) aparece dos veces en la reserva',
      );
    }
    await this.sucursalesService.assertExists(dto.sucursalId);
    for (const item of dto.items) {
      const variante = await this.productosService.findVarianteById(item.varianteId);
      // Mismo criterio que carrito/ventas: no se reserva lo que ya no se vende.
      if (!variante.activo || !variante.producto?.activo) {
        throw new OperacionInvalidaException(
          `"${variante.producto?.titulo ?? 'Una prenda'}" ya no está disponible para reservar`,
        );
      }
    }

    return this.dataSource.transaction(async (manager) => {
      // El cupo se revisa DENTRO de la tx con la fila de la clienta bloqueada:
      // dos POST simultáneos se serializan acá y el segundo ve la primera
      // reserva (antes ambos contaban 1 activa y pasaban el tope). SQL crudo
      // para no importar la entidad Usuario de otro módulo.
      await manager.query('SELECT id FROM usuarios WHERE id = $1 AND tenant_id = $2 FOR UPDATE', [
        clienteId,
        tenantActual(),
      ]);
      const cupo = await this.cupo(clienteId, false, manager);
      if (!cupo.puedeReservar) {
        throw new ForbiddenActionException(cupo.motivo ?? 'No podés reservar en este momento');
      }

      for (const item of dto.items) {
        try {
          await this.inventarioSucursalService.ajustarReserva({
            varianteId: item.varianteId,
            sucursalId: dto.sucursalId,
            cantidad: item.cantidad,
            tipoMovimiento: TipoMovimientoInventario.RESERVA,
            usuarioId: clienteId,
            manager,
            fraccionMaximaReservable: REGLAS_RESERVA.fraccionReservable,
          });
        } catch (err) {
          // El mensaje de inventario lleva uuids: a la clienta se le explica en
          // palabras (y el tope de reservables se nota igual que "sin stock").
          if (err instanceof StockInsuficienteException) {
            throw new OperacionInvalidaException(
              'No quedan unidades de esa talla y color para reservar en esta sucursal. ' +
                'Probá otra sucursal, o comprala directamente.',
            );
          }
          throw err;
        }
      }

      const reservaRepo = manager.getRepository(Reserva);
      const reserva = await reservaRepo.save(
        reservaRepo.create({
          clienteId,
          sucursalId: dto.sucursalId,
          estado: EstadoReserva.PENDIENTE,
          fechaHoraPrevista: new Date(dto.fechaHoraPrevista),
        }),
      );

      const itemRepo = manager.getRepository(ReservaItem);
      const items = await itemRepo.save(
        dto.items.map((item) =>
          itemRepo.create({ reserva, varianteId: item.varianteId, cantidad: item.cantidad }),
        ),
      );

      return this.toResponse(reserva, items);
    });
  }

  /**
   * Cuánto puede reservar la clienta ahora: reservas activas contra el máximo,
   * y bloqueo por faltas (`faltasParaBloqueo` en `ventanaFaltasDias` bloquean
   * `diasDeBloqueo` desde la última). La falta se fecha por la hora que ella
   * misma eligió, no por cuándo la marcó el sistema.
   */
  async cupo(
    clienteId: string,
    barrer = true,
    manager?: EntityManager,
  ): Promise<CupoReservaResponseDto> {
    if (barrer) await this.expirarVencidas();
    const ahora = Date.now();
    const R = REGLAS_RESERVA;
    const repo = manager ? manager.getRepository(Reserva) : this.reservaRepository;

    const reservasActivas = await repo.count({
      where: soloTenant({ clienteId, estado: In(ESTADOS_ACTIVOS) }),
    });
    const faltas = await repo.find({
      where: soloTenant({
        clienteId,
        estado: In(ESTADOS_FALTA),
        fechaHoraPrevista: MoreThanOrEqual(new Date(ahora - R.ventanaFaltasDias * MS_DIA)),
      }),
      order: { fechaHoraPrevista: 'DESC' },
    });

    let bloqueadaHasta: Date | null = null;
    if (faltas.length >= R.faltasParaBloqueo) {
      const fin = faltas[0].fechaHoraPrevista.getTime() + R.diasDeBloqueo * MS_DIA;
      if (fin > ahora) bloqueadaHasta = new Date(fin);
    }

    let motivo: string | null = null;
    if (bloqueadaHasta) {
      motivo =
        `No te presentaste a ${faltas.length} reservas en los últimos ${R.ventanaFaltasDias} días. ` +
        `Vas a poder volver a reservar desde el ${bloqueadaHasta.toLocaleDateString('es-BO')}. ` +
        'Mientras tanto podés comprar la prenda directamente.';
    } else if (reservasActivas >= R.maxReservasActivas) {
      motivo =
        `Ya tenés ${reservasActivas} reservas activas (el máximo es ${R.maxReservasActivas}). ` +
        'Cancelá una o esperá a usarla para reservar otra.';
    }

    return {
      puedeReservar: motivo === null,
      motivo,
      reservasActivas,
      maxReservasActivas: R.maxReservasActivas,
      faltasRecientes: faltas.length,
      faltasParaBloqueo: R.faltasParaBloqueo,
      bloqueadaHasta,
      maxUnidadesPorVariante: R.maxUnidadesPorVariante,
      maxPrendasPorReserva: R.maxPrendasPorReserva,
      anticipacionMinimaMinutos: R.anticipacionMinimaMinutos,
      ventanaMaximaHoras: R.ventanaMaximaHoras,
      toleranciaMinutos: R.toleranciaMinutos,
    };
  }

  /**
   * Vence las reservas cuya hora (+ tolerancia) ya pasó sin que la clienta
   * llegara: CONFIRMADA → NO_SHOW (la tienda la esperaba), PENDIENTE →
   * EXPIRADA (nunca se llegó a confirmar). Las dos cuentan como falta y las dos
   * liberan el stock reservado. EN_TIENDA recién se cierra (CANCELADA, sin
   * falta) si pasaron `horasMaximasEnTienda` sin compra, y nunca mientras tenga
   * una compra PENDIENTE de pago.
   *
   * Recorre TODAS las tiendas (corre sin request): lee id + tenant_id y cierra
   * cada una dentro de conTenant con el tenant de su propia fila.
   */
  async expirarVencidas(): Promise<number> {
    const limite = new Date(Date.now() - REGLAS_RESERVA.toleranciaMinutos * MS_MINUTO);
    const vencidas = await this.reservaRepository.find({
      where: { // sin-tenant: barrida global de todas las tiendas
        estado: In([EstadoReserva.PENDIENTE, EstadoReserva.CONFIRMADA]),
        fechaHoraPrevista: LessThan(limite),
      },
      take: 200,
    });
    const enTiendaOlvidadas = await this.reservaRepository.find({
      where: { // sin-tenant: barrida global de todas las tiendas
        estado: EstadoReserva.EN_TIENDA,
        fechaHoraPrevista: LessThan(
          new Date(Date.now() - REGLAS_RESERVA.horasMaximasEnTienda * 60 * MS_MINUTO),
        ),
      },
      take: 200,
    });
    let cerradas = 0;
    for (const reserva of [...vencidas, ...enTiendaOlvidadas]) {
      const destino =
        reserva.estado === EstadoReserva.CONFIRMADA
          ? EstadoReserva.NO_SHOW
          : reserva.estado === EstadoReserva.EN_TIENDA
            ? EstadoReserva.CANCELADA
            : EstadoReserva.EXPIRADA;
      try {
        await conTenant({ tenantId: reserva.tenantId }, () =>
          this.dataSource.transaction(async (manager) => {
            // Se relee con bloqueo: otra barrida o el staff pudo moverla recién.
            const actual = await this.bloquear(reserva.id, manager);
            if (actual.estado !== reserva.estado) return;
            // EN_TIENDA con una compra esperando el cobro (efectivo hasta 1 día):
            // no se cierra; la venta, al pagarse, la completa.
            if (await this.tieneCompraPendiente(actual, manager)) return;
            await this.transicionar(actual, destino, manager);
            cerradas++;
          }),
        );
      } catch (err) {
        this.logger.warn(`No se pudo vencer la reserva ${reserva.id}: ${String(err)}`);
      }
    }
    return cerradas;
  }

  private validarHorario(fecha: Date): void {
    const R = REGLAS_RESERVA;
    const minutosHasta = (fecha.getTime() - Date.now()) / MS_MINUTO;
    if (minutosHasta < R.anticipacionMinimaMinutos) {
      throw new OperacionInvalidaException(
        `Reservá con al menos ${R.anticipacionMinimaMinutos} minutos de anticipación`,
      );
    }
    if (minutosHasta > R.ventanaMaximaHoras * 60) {
      throw new OperacionInvalidaException(
        `Solo se puede reservar para las próximas ${R.ventanaMaximaHoras} horas`,
      );
    }
  }

  // RF12 (cliente) + consulta interna de staff por sucursal/estado.
  async findAll(filtro: {
    clienteId?: string;
    sucursalId?: string;
    estado?: string;
  }): Promise<ReservaResponseDto[]> {
    await this.expirarVencidas();
    const reservas = await this.reservaRepository.find({
      where: soloTenant({
        ...(filtro.clienteId ? { clienteId: filtro.clienteId } : {}),
        ...(filtro.sucursalId ? { sucursalId: filtro.sucursalId } : {}),
        ...(filtro.estado ? { estado: filtro.estado as EstadoReserva } : {}),
      }),
      order: { fechaHoraPrevista: 'DESC' },
    });
    return Promise.all(reservas.map((r) => this.cargarYMapear(r)));
  }

  async findOne(id: string): Promise<Reserva> {
    const reserva = await this.reservaRepository.findOne({ where: soloTenant({ id }) });
    if (!reserva) {
      throw new RecursoNoEncontradoException('Reserva', id);
    }
    return reserva;
  }

  async findOneResponse(id: string): Promise<ReservaResponseDto> {
    return this.cargarYMapear(await this.findOne(id));
  }

  // Transición manual por staff (ADMIN/ENCARGADO_SUCURSAL): confirmar,
  // marcar en tienda, cancelar por la tienda, marcar expirada o no-show.
  async cambiarEstado(id: string, nuevoEstado: EstadoReserva): Promise<ReservaResponseDto> {
    return this.dataSource.transaction(async (manager) =>
      this.transicionar(await this.bloquear(id, manager), nuevoEstado, manager),
    );
  }

  // Relee la reserva con bloqueo dentro de la tx (como expirarVencidas): dos
  // cambios simultáneos se serializan y el segundo ve el estado ya cambiado,
  // así el stock reservado no se libera dos veces.
  private async bloquear(id: string, manager: EntityManager): Promise<Reserva> {
    const reserva = await manager
      .getRepository(Reserva)
      .findOne({ where: soloTenant({ id }), lock: { mode: 'pessimistic_write' } });
    if (!reserva) {
      throw new RecursoNoEncontradoException('Reserva', id);
    }
    return reserva;
  }

  // RF: "Consultar y cancelar reservas" — acción del propio cliente, no de
  // staff. Mismo motor de transición, pero exige que la reserva sea suya.
  async cancelar(id: string, clienteId: string): Promise<ReservaResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const reserva = await this.bloquear(id, manager);
      if (reserva.clienteId !== clienteId) {
        throw new ForbiddenActionException('No podés cancelar la reserva de otro cliente');
      }
      // Ya en la tienda se cierra comprando (POST /ventas/desde-reserva/:id) o
      // con "No compró" del personal: cancelarla desde el celular mientras se
      // prueba dejaría a la tienda sin saber qué pasó con las prendas.
      if (reserva.estado === EstadoReserva.EN_TIENDA) {
        throw new OperacionInvalidaException(
          'Ya estás en la tienda con esta reserva: pedile al personal que la cierre',
        );
      }
      return this.transicionar(reserva, EstadoReserva.CANCELADA, manager);
    });
  }

  /**
   * Compra desde la reserva (CU de la clienta en la tienda): valida, con la
   * reserva bloqueada, que sea suya, que esté EN_TIENDA y que no tenga ya otra
   * compra esperando el cobro. Devuelve sucursal e ítems para que ventas arme
   * la venta PENDIENTE. El stock sigue apartado por la reserva hasta el pago.
   */
  async paraComprar(
    id: string,
    clienteId: string,
    manager: EntityManager,
  ): Promise<{ sucursalId: string; items: { varianteId: string; cantidad: number }[] }> {
    const reserva = await this.bloquear(id, manager);
    if (reserva.clienteId !== clienteId) {
      throw new ForbiddenActionException('No podés comprar la reserva de otra clienta');
    }
    if (reserva.estado !== EstadoReserva.EN_TIENDA) {
      throw new OperacionInvalidaException(
        'Solo se compra una reserva cuando el personal te marcó en la tienda',
      );
    }
    if (await this.tieneCompraPendiente(reserva, manager)) {
      throw new OperacionInvalidaException(
        'Ya tenés una compra de esta reserva esperando el pago: pagala o cancelala desde Mis pedidos',
      );
    }
    const items = await manager
      .getRepository(ReservaItem)
      .find({ where: soloTenant({ reserva: { id } }) });
    return {
      sucursalId: reserva.sucursalId,
      items: items.map((i) => ({ varianteId: i.varianteId, cantidad: i.cantidad })),
    };
  }

  // Llamado por VentasService al aprobarse el pago de una compra desde la
  // reserva: la cierra y libera el stock reservado (el stock físico lo
  // descuenta la venta en el mismo momento, vía ajustarStock).
  async completarPorVenta(id: string, sucursalId: string, manager: EntityManager): Promise<void> {
    const reserva = await this.bloquear(id, manager);
    // Sin esto se podía cobrar en una sucursal la reserva de otra: el stock se
    // descontaba en una y la reserva se liberaba en la otra.
    if (reserva.sucursalId !== sucursalId) {
      throw new OperacionInvalidaException(
        'La reserva es de otra sucursal: se tiene que cobrar en la sucursal donde se reservó',
      );
    }
    if (reserva.estado !== EstadoReserva.EN_TIENDA) {
      throw new OperacionInvalidaException(
        `La reserva ${id} debe estar EN_TIENDA para completarse con una venta (está ${reserva.estado})`,
      );
    }
    await this.transicionar(reserva, EstadoReserva.COMPLETADA, manager);
  }

  // SQL crudo (con tenant) para no importar la entidad Venta de otro módulo.
  private async tieneCompraPendiente(reserva: Reserva, manager: EntityManager): Promise<boolean> {
    if (reserva.estado !== EstadoReserva.EN_TIENDA) return false;
    const filas: unknown[] | undefined = await manager.query(
      "SELECT 1 FROM ventas WHERE reserva_id = $1 AND tenant_id = $2 AND estado = 'PENDIENTE' LIMIT 1",
      [reserva.id, tenantActual()],
    );
    return (filas?.length ?? 0) > 0;
  }

  private async transicionar(
    reserva: Reserva,
    nuevoEstado: EstadoReserva,
    manager: EntityManager,
  ): Promise<ReservaResponseDto> {
    const permitidos = TRANSICIONES_MANUALES[reserva.estado] ?? [];
    const esCompletarDesdeEnTienda =
      nuevoEstado === EstadoReserva.COMPLETADA && reserva.estado === EstadoReserva.EN_TIENDA;
    if (!permitidos.includes(nuevoEstado) && !esCompletarDesdeEnTienda) {
      throw new OperacionInvalidaException(
        `No se puede pasar la reserva de ${reserva.estado} a ${nuevoEstado}`,
      );
    }
    // "No compró" mientras su compra espera el cobro dejaría vendida una
    // prenda que ya no está apartada: primero se paga o se cancela la compra.
    if (nuevoEstado === EstadoReserva.CANCELADA && (await this.tieneCompraPendiente(reserva, manager))) {
      throw new OperacionInvalidaException(
        'La clienta tiene una compra de esta reserva esperando el pago: confirmá el cobro o esperá a que se cancele',
      );
    }

    if (ESTADOS_QUE_LIBERAN_STOCK.includes(nuevoEstado)) {
      const itemRepo = manager.getRepository(ReservaItem);
      const items = await itemRepo.find({ where: soloTenant({ reserva: { id: reserva.id } }) });
      for (const item of items) {
        await this.inventarioSucursalService.ajustarReserva({
          varianteId: item.varianteId,
          sucursalId: reserva.sucursalId,
          cantidad: -item.cantidad,
          tipoMovimiento: TipoMovimientoInventario.LIBERACION_RESERVA,
          manager,
        });
      }
    }

    reserva.estado = nuevoEstado;
    const reservaRepo = manager.getRepository(Reserva);
    const guardada = await reservaRepo.save(reserva);
    const items = await manager
      .getRepository(ReservaItem)
      .find({ where: soloTenant({ reserva: { id: guardada.id } }) });
    return this.toResponse(guardada, items);
  }

  private async cargarYMapear(reserva: Reserva): Promise<ReservaResponseDto> {
    const items = await this.reservaItemRepository.find({
      where: soloTenant({ reserva: { id: reserva.id } }),
    });
    return this.toResponse(reserva, items);
  }

  private toResponse(reserva: Reserva, items: ReservaItem[]): ReservaResponseDto {
    return {
      id: reserva.id,
      clienteId: reserva.clienteId,
      sucursalId: reserva.sucursalId,
      estado: reserva.estado,
      fechaHoraPrevista: reserva.fechaHoraPrevista,
      createdAt: reserva.createdAt,
      items: items.map((i) => ({ id: i.id, varianteId: i.varianteId, cantidad: i.cantidad })),
    };
  }
}
