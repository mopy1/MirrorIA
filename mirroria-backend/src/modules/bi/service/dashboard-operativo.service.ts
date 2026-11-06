import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';
import { ForbiddenActionException } from '../../../core/exception/forbidden-action.exception.js';
import { RecursoNoEncontradoException } from '../../../core/exception/recurso-no-encontrado.exception.js';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { tenantActual } from '../../../core/tenancy/tenant-context.js';
import { FiltroDashboardOperativoDto } from '../dto/filtro-dashboard-operativo.dto.js';
import type {
  AlertaStockItemDto,
  ClienteReservaDto,
  DashboardOperativoResponseDto,
  KpisOperativoDto,
  PrendaReservaDto,
  ReservaHoyItemDto,
  SucursalResumenDto,
} from '../dto/dashboard-operativo.dto.js';
import { PeriodosService } from './periodos.service.js';

interface FilaSucursal {
  id: string;
  nombre: string;
  ciudad: string;
}

interface FilaCajaHoy {
  monto_cents: string | number;
  cantidad_tickets: string | number;
  ticket_promedio_cents: string | number;
}

interface FilaPendientesHoy {
  cantidad: string | number;
  monto_cents: string | number;
}

interface FilaResumenReservasHoy {
  total_hoy: string | number;
  por_llegar: string | number;
  en_tienda: string | number;
  completadas: string | number;
}

interface FilaConteoStock {
  criticos: string | number;
  agotados: string | number;
}

interface FilaDetalleReserva {
  reserva_id: string;
  hora_prevista: string;
  estado: string;
  fecha_hora_prevista: Date | string;
  cliente: ClienteReservaDto;
  prendas: PrendaReservaDto[];
}

interface FilaAlertaStock {
  inventario_id: string;
  producto_id: string;
  producto_nombre: string;
  talla: string;
  color: string;
  cantidad_disponible: number;
  nivel: 'AGOTADO' | 'CRITICO';
}

@Injectable()
export class DashboardOperativoService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly periodosService: PeriodosService,
  ) {}

  async obtener(
    user: JwtPayload,
    filtro: FiltroDashboardOperativoDto = {},
  ): Promise<DashboardOperativoResponseDto> {
    const tenantId = tenantActual();

    // 1. Resolver sucursal según rol
    let sucursalId: string | null | undefined;

    if (user.role === 'ADMIN') {
      sucursalId = filtro.sucursalId;
    } else {
      // CAJERO / ENCARGADO_SUCURSAL
      sucursalId = user.sucursalId;
    }

    // Si no tiene sucursal asignada o no se especificó, buscar la primera activa del tenant
    if (!sucursalId) {
      const primeraRows = (await this.dataSource.query(
        'SELECT id FROM sucursales WHERE tenant_id = $1 AND activo = true ORDER BY "createdAt" ASC LIMIT 1',
        [tenantId],
      )) as Array<{ id: string }>;

      if (primeraRows.length === 0) {
        if (user.role !== 'ADMIN') {
          throw new ForbiddenActionException('Tu cuenta no tiene una sucursal asignada');
        }
        throw new RecursoNoEncontradoException('No hay sucursales disponibles en el tenant');
      }
      sucursalId = primeraRows[0].id;
    }

    // Obtener detalles de la sucursal (nombre, ciudad)
    const sucursalRows = (await this.dataSource.query(
      `SELECT s.id, s.nombre, COALESCE(c.nombre, 'Sin ciudad') AS ciudad
       FROM sucursales s
       LEFT JOIN ciudades c ON s.ciudad_id = c.id
       WHERE s.tenant_id = $1 AND s.id = $2
       LIMIT 1;`,
      [tenantId, sucursalId],
    )) as FilaSucursal[];

    if (sucursalRows.length === 0) {
      throw new RecursoNoEncontradoException('La sucursal especificada no existe en la tienda');
    }

    const sucursalDto: SucursalResumenDto = {
      id: sucursalRows[0].id,
      nombre: sucursalRows[0].nombre,
      ciudad: sucursalRows[0].ciudad,
    };

    // 2. Corte horario de hoy en America/La_Paz
    const { hoyStr, inicioHoy, finHoy } = this.periodosService.obtenerHoyLaPaz();

    // 3. Ejecutar consultas operativas en paralelo
    const [
      cajaRows,
      pendientesRows,
      reservasResumenRows,
      stockConteoRows,
      detalleReservasRows,
      alertasStockRows,
    ] = await Promise.all([
      // 3.1 Ventas de hoy en la sucursal
      this.dataSource.query(
        `SELECT 
          COALESCE(SUM(total_cents), 0)::bigint AS monto_cents,
          COUNT(id)::int AS cantidad_tickets,
          COALESCE(AVG(total_cents), 0)::bigint AS ticket_promedio_cents
        FROM ventas
        WHERE tenant_id = $1
          AND sucursal_id = $2
          AND estado IN ('PAGADA', 'ENTREGADA')
          AND "createdAt" >= $3 AND "createdAt" <= $4;`,
        [tenantId, sucursalId, inicioHoy, finHoy],
      ) as Promise<FilaCajaHoy[]>,

      // 3.2 Cobros pendientes en mostrador de la sucursal
      this.dataSource.query(
        `SELECT 
          COUNT(id)::int AS cantidad,
          COALESCE(SUM(total_cents), 0)::bigint AS monto_cents
        FROM ventas
        WHERE tenant_id = $1
          AND sucursal_id = $2
          AND estado = 'PENDIENTE';`,
        [tenantId, sucursalId],
      ) as Promise<FilaPendientesHoy[]>,

      // 3.3 Resumen de reservas de hoy
      this.dataSource.query(
        `SELECT 
          COUNT(*)::int AS total_hoy,
          COUNT(CASE WHEN estado IN ('PENDIENTE', 'CONFIRMADA') THEN 1 END)::int AS por_llegar,
          COUNT(CASE WHEN estado = 'EN_TIENDA' THEN 1 END)::int AS en_tienda,
          COUNT(CASE WHEN estado = 'COMPLETADA' THEN 1 END)::int AS completadas
        FROM reservas
        WHERE tenant_id = $1
          AND sucursal_id = $2
          AND fecha_hora_prevista >= $3 AND fecha_hora_prevista <= $4;`,
        [tenantId, sucursalId, inicioHoy, finHoy],
      ) as Promise<FilaResumenReservasHoy[]>,

      // 3.4 Conteo de stock crítico y agotado
      this.dataSource.query(
        `SELECT 
          COUNT(CASE WHEN cantidad_disponible = 0 THEN 1 END)::int AS agotados,
          COUNT(CASE WHEN cantidad_disponible > 0 AND cantidad_disponible <= 2 THEN 1 END)::int AS criticos
        FROM inventario_sucursal
        WHERE tenant_id = $1
          AND sucursal_id = $2
          AND cantidad_disponible <= 2;`,
        [tenantId, sucursalId],
      ) as Promise<FilaConteoStock[]>,

      // 3.5 Detalle de reservas de hoy (agenda con clienta y prendas)
      this.dataSource.query(
        `SELECT 
          r.id AS reserva_id,
          TO_CHAR((r.fecha_hora_prevista AT TIME ZONE 'UTC' AT TIME ZONE 'America/La_Paz'), 'HH24:MI') AS hora_prevista,
          r.estado,
          r.fecha_hora_prevista,
          json_build_object(
            'id', u.id,
            'nombre', u.full_name,
            'telefono', u.email
          ) AS cliente,
          COALESCE(
            json_agg(
              json_build_object(
                'nombre', p.titulo,
                'talla', t.nombre,
                'color', col.nombre,
                'cantidad', ri.cantidad
              )
            ) FILTER (WHERE ri.id IS NOT NULL), '[]'::json
          ) AS prendas
        FROM reservas r
        JOIN usuarios u ON r.cliente_id = u.id
        LEFT JOIN reserva_items ri ON ri.reserva_id = r.id
        LEFT JOIN variantes_producto vp ON ri.variante_id = vp.id
        LEFT JOIN productos p ON vp.producto_id = p.id
        LEFT JOIN tallas t ON vp.talla_id = t.id
        LEFT JOIN colores col ON vp.color_id = col.id
        WHERE r.tenant_id = $1
          AND r.sucursal_id = $2
          AND r.fecha_hora_prevista >= $3 AND r.fecha_hora_prevista <= $4
        GROUP BY r.id, r.fecha_hora_prevista, r.estado, u.id, u.full_name, u.email
        ORDER BY r.fecha_hora_prevista ASC
        LIMIT 10;`,
        [tenantId, sucursalId, inicioHoy, finHoy],
      ) as Promise<FilaDetalleReserva[]>,

      // 3.6 Alertas de stock crítico en sucursal (<= 2 unidades)
      this.dataSource.query(
        `SELECT 
          inv.id AS inventario_id,
          p.id AS producto_id,
          p.titulo AS producto_nombre,
          t.nombre AS talla,
          col.nombre AS color,
          inv.cantidad_disponible,
          CASE WHEN inv.cantidad_disponible = 0 THEN 'AGOTADO' ELSE 'CRITICO' END AS nivel
        FROM inventario_sucursal inv
        JOIN variantes_producto vp ON inv.variante_id = vp.id
        JOIN productos p ON vp.producto_id = p.id
        JOIN tallas t ON vp.talla_id = t.id
        JOIN colores col ON vp.color_id = col.id
        WHERE inv.tenant_id = $1
          AND inv.sucursal_id = $2
          AND inv.cantidad_disponible <= 2
        ORDER BY inv.cantidad_disponible ASC, p.titulo ASC
        LIMIT 10;`,
        [tenantId, sucursalId],
      ) as Promise<FilaAlertaStock[]>,
    ]);

    // 4. Formatear KPIs del turno
    const caja = cajaRows[0] ?? { monto_cents: 0, cantidad_tickets: 0, ticket_promedio_cents: 0 };
    const montoCajaCents = Number(caja.monto_cents);
    const ticketsCaja = Number(caja.cantidad_tickets);
    const ticketPromedioBs = ticketsCaja > 0
      ? Math.round(montoCajaCents / ticketsCaja) / 100
      : 0;

    const pendientes = pendientesRows[0] ?? { cantidad: 0, monto_cents: 0 };
    const resResumen = reservasResumenRows[0] ?? { total_hoy: 0, por_llegar: 0, en_tienda: 0, completadas: 0 };
    const stockResumen = stockConteoRows[0] ?? { criticos: 0, agotados: 0 };

    const kpisHoy: KpisOperativoDto = {
      ventas: {
        montoCents: montoCajaCents,
        montoBs: montoCajaCents / 100,
        cantidadTickets: ticketsCaja,
        ticketPromedioBs,
      },
      cobrosPendientes: {
        cantidad: Number(pendientes.cantidad),
        montoEstimadoBs: Number(pendientes.monto_cents) / 100,
      },
      reservas: {
        totalHoy: Number(resResumen.total_hoy),
        porLlegar: Number(resResumen.por_llegar),
        enTienda: Number(resResumen.en_tienda),
        completadas: Number(resResumen.completadas),
      },
      stock: {
        criticos: Number(stockResumen.criticos),
        agotados: Number(stockResumen.agotados),
      },
    };

    // 5. Formatear Detalle de Reservas
    const ahora = new Date();
    const reservasHoy: ReservaHoyItemDto[] = detalleReservasRows.map((r) => {
      const fechaPrev = new Date(r.fecha_hora_prevista);
      const minutos = this.periodosService.minutosParaCita(fechaPrev, ahora);
      return {
        reservaId: r.reserva_id,
        horaPrevista: r.hora_prevista,
        estado: r.estado,
        cliente: {
          id: r.cliente.id,
          nombre: r.cliente.nombre,
          telefono: r.cliente.telefono ?? null,
        },
        prendas: Array.isArray(r.prendas) ? r.prendas : [],
        minutosParaCita: minutos,
      };
    });

    // 6. Formatear Alertas de Stock
    const alertasStock: AlertaStockItemDto[] = alertasStockRows.map((a) => ({
      inventarioId: a.inventario_id,
      productoId: a.producto_id,
      productoNombre: a.producto_nombre,
      talla: a.talla,
      color: a.color,
      stockDisponible: Number(a.cantidad_disponible),
      nivel: a.nivel,
    }));

    return {
      fecha: hoyStr,
      sucursal: sucursalDto,
      kpisHoy,
      reservasHoy,
      alertasStock,
    };
  }
}
