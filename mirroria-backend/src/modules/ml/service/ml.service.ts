import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import { sucursalDelStaff } from '../../../core/security/sucursal-del-staff.js';
import { tenantActual } from '../../../core/tenancy/tenant-context.js';
import type {
  DemandaMlResponseDto,
  FiltroDemandaDto,
  ItemPrediccionDemandaDto,
} from '../dto/demanda-ml.dto.js';
import type {
  FiltroNoShowDto,
  ItemEvaluacionNoShowDto,
  NoShowMlResponseDto,
} from '../dto/no-show-ml.dto.js';
import type {
  ItemClientaRfmDto,
  RfmMlResponseDto,
} from '../dto/rfm-ml.dto.js';
import type {
  AnomaliasMlResponseDto,
  ItemDiagnosticoAnomaliaDto,
} from '../dto/anomalias-ml.dto.js';
import type {
  MetricasModelosMlResponseDto,
} from '../dto/metricas-ml.dto.js';

interface PrendaDb {
  producto_id: string;
  producto_nombre: string;
  categoria: string;
  precio_cents: number;
  stock_actual: number;
  vendidas_7d: number;
}

interface ReservaDb {
  reserva_id: string;
  hora_prevista: string;
  hora_cita: number;
  dia_semana_iso: number;
  fecha_hora_prevista: string | Date;
  createdAt: string | Date;
  cliente_nombre: string;
  prendas_count: number;
  previas: number;
  asistidas: number;
}

interface ClientaDb {
  clienta_id: string;
  cliente_nombre: string;
  recency_dias: number;
  frequency_compras: number;
  monetary_cents: number | string;
}

interface VentaDb {
  venta_id: string;
  monto_total_cents: number | string;
  descuento_cents: number | string;
  hora_venta: number;
  metodo_pago: string;
  cantidad_items: number;
}

/** Sin historial se usa la asistencia media del dataset de entrenamiento. */
const ASISTENCIA_SIN_HISTORIAL = 0.78;

function rasgosDeReserva(r: ReservaDb) {
  const diffMs = Math.max(0, new Date(r.fecha_hora_prevista).getTime() - new Date(r.createdAt).getTime());
  return {
    reserva_id: r.reserva_id,
    dias_anticipacion: Math.min(30, Math.round(diffMs / 86400000)),
    hora_cita: r.hora_cita,
    dia_semana: r.dia_semana_iso - 1, // el modelo usa 0 = lunes
    prendas_apartadas_count: r.prendas_count || 1,
    reservas_previas_total: r.previas,
    tasa_asistencia_historica: r.previas > 0 ? r.asistidas / r.previas : ASISTENCIA_SIN_HISTORIAL,
    es_fin_de_semana: r.dia_semana_iso >= 6,
  };
}

@Injectable()
export class MlService {
  private readonly logger = new Logger(MlService.name);
  private readonly defaultBaseUrls = [
    process.env.ML_SERVICE_URL || 'http://mirroria-ml:8002',
    'http://mirroria-ml:8002',
    'http://mirroria_ml:8002',
    'http://127.0.0.1:8002',
    'http://localhost:8002',
  ];

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /**
   * Ejecuta petición HTTP hacia el microservicio Python con timeout estricto de 3s
   * y reintento en fallback de URL local.
   */
  private async fetchMl<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: any,
  ): Promise<{ data: T | null; error: Error | null }> {
    for (const baseUrl of this.defaultBaseUrls) {
      try {
        const url = `${baseUrl.replace(/\/$/, '')}${endpoint}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        const options: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          signal: controller.signal,
        };

        if (method !== 'GET' && body) {
          options.body = JSON.stringify(body);
        }

        const res = await fetch(url, options);

        clearTimeout(timeout);

        if (res.ok) {
          const data = (await res.json()) as T;
          return { data, error: null };
        }
      } catch {
        // Continuar al siguiente endpoint disponible
      }
    }

    return { data: null, error: new Error('Microservicio ML no disponible en red') };
  }

  // =========================================================================
  // M1: DEMANDA DE PRENDAS Y REABASTECIMIENTO
  // =========================================================================
  async obtenerKpisDemanda(
    user: JwtPayload,
    filtro: FiltroDemandaDto = {},
  ): Promise<DemandaMlResponseDto> {
    const tenantId = tenantActual();
    const horizonteDias = filtro.dias ?? 30;

    let sucursalId = filtro.sucursalId;
    if (user.role === 'ENCARGADO_SUCURSAL') {
      const propia = sucursalDelStaff(user);
      if (propia) sucursalId = propia;
    }

    // 1. Catálogo, stock y ventas reales de la última semana. Sin try/catch a
    // propósito: tragarse un error de SQL mostraba datos inventados como reales.
    const prendasDb = (await this.dataSource.query(
      `SELECT
        p.id::text AS producto_id,
        p.titulo AS producto_nombre,
        COALESCE(c.nombre, 'VESTIDOS') AS categoria,
        p.precio_cents::int AS precio_cents,
        COALESCE((
          SELECT SUM(inv.cantidad_disponible)
          FROM inventario_sucursal inv
          JOIN variantes_producto vp ON vp.id = inv.variante_id
          WHERE vp.producto_id = p.id AND inv.tenant_id = $1
            AND ($2::uuid IS NULL OR inv.sucursal_id = $2::uuid)
        ), 0)::int AS stock_actual,
        COALESCE((
          SELECT SUM(vi.cantidad)
          FROM venta_items vi
          JOIN ventas v ON v.id = vi.venta_id
          JOIN variantes_producto vp ON vp.id = vi.variante_id
          WHERE vp.producto_id = p.id AND v.tenant_id = $1
            AND v.estado IN ('PAGADA', 'ENTREGADA')
            AND v."createdAt" >= NOW() - INTERVAL '7 days'
            AND ($2::uuid IS NULL OR v.sucursal_id = $2::uuid)
        ), 0)::int AS vendidas_7d
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.tenant_id = $1 AND p.activo = true
      ORDER BY stock_actual ASC, vendidas_7d DESC
      LIMIT 50;`,
      [tenantId, sucursalId ?? null],
    )) as PrendaDb[];

    if (prendasDb.length === 0) {
      return {
        horizonte_dias: horizonteDias,
        total_items_evaluados: 0,
        predicciones: [],
        kpis_resumen: { quiebre_stock_rate_pct: 0, rotacion_proyectada: 0 },
        fallback: false,
      };
    }

    const payload = {
      tenant_id: tenantId,
      horizonte_dias: horizonteDias,
      prendas: prendasDb.map((p) => ({
        producto_id: p.producto_id,
        categoria: p.categoria.toUpperCase(),
        sucursal_id: sucursalId ?? 'todas',
        precio_cents: p.precio_cents,
        descuento_pct: 0.0,
        es_temporada_alta: [4, 8, 11].includes(new Date().getMonth()),
        stock_actual: p.stock_actual,
        demanda_historica_lag7: p.vendidas_7d,
      })),
    };

    // 2. Inferencia en mirroria-ml
    const { data: mlResponse } = await this.fetchMl<any>(
      '/predict/demanda',
      'POST',
      payload,
    );

    if (mlResponse && mlResponse.predicciones) {
      return {
        horizonte_dias: mlResponse.horizonte_dias,
        total_items_evaluados: mlResponse.total_items_evaluados,
        predicciones: mlResponse.predicciones.map((item: ItemPrediccionDemandaDto, idx: number) => ({
          ...item,
          nombre: prendasDb[idx]?.producto_nombre,
          categoria: prendasDb[idx]?.categoria,
        })),
        kpis_resumen: mlResponse.kpis_resumen,
        fallback: false,
      };
    }

    // 3. Fallback Heurístico en memoria si ML está offline
    this.logger.warn('Microservicio ML offline: calculando proyección de demanda heurística');
    const scale = horizonteDias / 30.0;
    let quiebres = 0;
    let demandaTotal = 0;
    let stockTotal = 0;

    const predicciones: ItemPrediccionDemandaDto[] = prendasDb.map((p) => {
      // Sin el modelo se proyecta el ritmo real de la última semana.
      const dem = Math.round((p.vendidas_7d / 7) * 30 * scale * 10) / 10;
      demandaTotal += dem;
      stockTotal += p.stock_actual;

      const reposicion = Math.max(0, Math.ceil(dem * 1.2) - p.stock_actual);
      const diasStock = dem > 0 ? Math.round((p.stock_actual / dem) * horizonteDias * 10) / 10 : 999;
      let riesgo: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO' = 'BAJO';

      if (p.stock_actual === 0) {
        riesgo = 'CRITICO';
        quiebres++;
      } else if (diasStock < 7) {
        riesgo = 'ALTO';
        quiebres++;
      } else if (diasStock < 20) {
        riesgo = 'MEDIO';
      }

      return {
        producto_id: p.producto_id,
        nombre: p.producto_nombre,
        categoria: p.categoria,
        demanda_proyectada_unidades: dem,
        stock_actual: p.stock_actual,
        reabastecimiento_sugerido: reposicion,
        riesgo_quiebre: riesgo,
        dias_de_stock_estimados: diasStock,
      };
    });

    const rate = Math.round((quiebres / predicciones.length) * 1000) / 10;
    const rot = Math.round((demandaTotal / (stockTotal + 1)) * 100) / 100;

    return {
      horizonte_dias: horizonteDias,
      total_items_evaluados: predicciones.length,
      predicciones,
      kpis_resumen: {
        quiebre_stock_rate_pct: rate,
        rotacion_proyectada: rot,
      },
      fallback: true,
    };
  }

  // =========================================================================
  // M2: EVALUACIÓN DE NO-SHOW EN RESERVAS
  // =========================================================================
  async obtenerKpisNoShow(
    user: JwtPayload,
    filtro: FiltroNoShowDto = {},
  ): Promise<NoShowMlResponseDto> {
    const tenantId = tenantActual();

    let sucursalId = filtro.sucursalId;
    if (user.role === 'CAJERO' || user.role === 'ENCARGADO_SUCURSAL') {
      const propia = sucursalDelStaff(user);
      if (propia) sucursalId = propia;
    }

    // 1. Reservas agendadas, con el historial real de asistencia de cada clienta.
    const reservasDb = (await this.dataSource.query(
      `SELECT
        r.id::text AS reserva_id,
        TO_CHAR(r.fecha_hora_prevista AT TIME ZONE 'UTC' AT TIME ZONE 'America/La_Paz', 'HH24:MI') AS hora_prevista,
        EXTRACT(HOUR FROM r.fecha_hora_prevista AT TIME ZONE 'UTC' AT TIME ZONE 'America/La_Paz')::int AS hora_cita,
        EXTRACT(ISODOW FROM r.fecha_hora_prevista AT TIME ZONE 'UTC' AT TIME ZONE 'America/La_Paz')::int AS dia_semana_iso,
        r.fecha_hora_prevista,
        r."createdAt",
        COALESCE(u.full_name, 'Clienta Registrada') AS cliente_nombre,
        (SELECT COUNT(*)::int FROM reserva_items ri WHERE ri.reserva_id = r.id) AS prendas_count,
        (SELECT COUNT(*)::int FROM reservas h WHERE h.cliente_id = r.cliente_id AND h.tenant_id = $1
          AND h.estado IN ('COMPLETADA', 'NO_SHOW')) AS previas,
        (SELECT COUNT(*)::int FROM reservas h WHERE h.cliente_id = r.cliente_id AND h.tenant_id = $1
          AND h.estado = 'COMPLETADA') AS asistidas
      FROM reservas r
      LEFT JOIN usuarios u ON r.cliente_id = u.id
      WHERE r.tenant_id = $1
        AND ($2::uuid IS NULL OR r.sucursal_id = $2::uuid)
        AND r.estado IN ('PENDIENTE', 'CONFIRMADA', 'EN_TIENDA')
      ORDER BY r.fecha_hora_prevista ASC
      LIMIT 15;`,
      [tenantId, sucursalId ?? null],
    )) as ReservaDb[];

    if (reservasDb.length === 0) {
      return { evaluaciones: [], tasa_no_show_esperada_pct: 0, alertas_criticas_count: 0, fallback: false };
    }

    const payload = {
      tenant_id: tenantId,
      reservas: reservasDb.map(rasgosDeReserva),
    };

    // 2. Inferencia en microservicio
    const { data: mlResponse } = await this.fetchMl<any>(
      '/predict/no-show',
      'POST',
      payload,
    );

    if (mlResponse && mlResponse.evaluaciones) {
      const evals = mlResponse.evaluaciones.map((e: any, idx: number) => ({
        ...e,
        hora_prevista: reservasDb[idx]?.hora_prevista ?? '15:00',
        cliente_nombre: reservasDb[idx]?.cliente_nombre ?? 'Clienta',
        prendas_apartadas_count: reservasDb[idx]?.prendas_count ?? 2,
      }));

      const criticas = evals.filter((e: any) => e.color_semaforo === 'ROJO').length;
      const mediaProb =
        evals.reduce((acc: number, curr: any) => acc + curr.probabilidad_no_show, 0) / (evals.length || 1);

      return {
        evaluaciones: evals,
        tasa_no_show_esperada_pct: Math.round(mediaProb * 1000) / 10,
        alertas_criticas_count: criticas,
        fallback: false,
      };
    }

    // 3. Fallback Heurístico en memoria
    this.logger.warn('Microservicio ML offline: calculando no-show heurístico');
    const evalsHeuristic: ItemEvaluacionNoShowDto[] = reservasDb.map((r) => {
      const rasgos = rasgosDeReserva(r);
      const prob =
        Math.round(Math.min(0.95, 0.1 + rasgos.dias_anticipacion * 0.02 + (1 - rasgos.tasa_asistencia_historica) * 0.6) * 100) / 100;
      const semaforo = prob >= 0.65 ? 'ROJO' : prob >= 0.35 ? 'AMARILLO' : 'VERDE';
      const clasificacion = prob >= 0.65 ? 'ALTO_RIESGO' : prob >= 0.35 ? 'RIESGO_MEDIO' : 'BAJO_RIESGO';
      const accion = prob >= 0.65 ? 'CONFIRMAR_WHATSAPP_PRIORITARIO' : prob >= 0.35 ? 'MONITOREAR' : 'ASISTIRA_NORMAL';

      return {
        reserva_id: r.reserva_id,
        probabilidad_no_show: prob,
        clasificacion,
        color_semaforo: semaforo,
        accion_recomendada: accion,
        factores_clave: prob >= 0.65 ? ['Reserva creada con alta anticipación', 'Clienta sin historial previo'] : ['Historial de asistencia regular'],
        hora_prevista: r.hora_prevista,
        cliente_nombre: r.cliente_nombre,
        prendas_apartadas_count: r.prendas_count,
      };
    });

    return {
      evaluaciones: evalsHeuristic,
      tasa_no_show_esperada_pct:
        Math.round((evalsHeuristic.reduce((a, e) => a + e.probabilidad_no_show, 0) / evalsHeuristic.length) * 1000) / 10,
      alertas_criticas_count: evalsHeuristic.filter((e) => e.color_semaforo === 'ROJO').length,
      fallback: true,
    };
  }

  // =========================================================================
  // M3: SEGMENTACIÓN RFM
  // =========================================================================
  async obtenerKpisRfm(_user: JwtPayload): Promise<RfmMlResponseDto> {
    const tenantId = tenantActual();

    // 1. Agrupar compras de clientas en PostgreSQL
    const clientasDb = (await this.dataSource.query(
      `SELECT
        u.id::text AS clienta_id,
        COALESCE(u.full_name, 'Clienta') AS cliente_nombre,
        COALESCE(EXTRACT(DAY FROM (NOW() - MAX(v."createdAt")))::int, 45) AS recency_dias,
        COUNT(v.id)::int AS frequency_compras,
        COALESCE(SUM(v.total_cents), 0)::bigint AS monetary_cents
      FROM usuarios u
      INNER JOIN ventas v ON v.cliente_id = u.id AND v.tenant_id = u.tenant_id
      WHERE u.tenant_id = $1 AND v.estado IN ('PAGADA', 'ENTREGADA')
      GROUP BY u.id, u.full_name
      HAVING COUNT(v.id) > 0
      ORDER BY monetary_cents DESC
      LIMIT 200;`,
      [tenantId],
    )) as ClientaDb[];

    if (clientasDb.length === 0) {
      return {
        total_clientas: 0,
        distribucion_clusters: {},
        clientas_clasificadas: [],
        tasa_retencion_estimada_pct: 0,
        clv_promedio_bs: 0,
        fallback: false,
      };
    }

    const payload = {
      tenant_id: tenantId,
      clientas: clientasDb.map((c) => ({
        clienta_id: c.clienta_id,
        recency_dias: c.recency_dias,
        frequency_compras: c.frequency_compras,
        monetary_cents: Number(c.monetary_cents),
      })),
    };

    // 2. Inferencia en microservicio ML
    const { data: mlResponse } = await this.fetchMl<any>(
      '/predict/rfm',
      'POST',
      payload,
    );

    if (mlResponse && mlResponse.clientas_clasificadas) {
      const clasif = mlResponse.clientas_clasificadas.map((item: any, idx: number) => ({
        ...item,
        recency_dias: clientasDb[idx]?.recency_dias,
        frequency_compras: clientasDb[idx]?.frequency_compras,
        monetary_cents: Number(clientasDb[idx]?.monetary_cents ?? 0),
        cliente_nombre: clientasDb[idx]?.cliente_nombre ?? 'Clienta',
      }));

      const clvTotal = clasif.reduce((acc: number, curr: any) => acc + curr.clv_estimado_bs, 0);
      const vipsCount = mlResponse.distribucion_clusters['VIPS_LEALES'] || 0;
      const potsCount = mlResponse.distribucion_clusters['POTENCIALES_NUEVAS'] || 0;
      const retencion = Math.round(((vipsCount + potsCount) / (clasif.length || 1)) * 1000) / 10;

      return {
        total_clientas: clasif.length,
        distribucion_clusters: mlResponse.distribucion_clusters,
        clientas_clasificadas: clasif,
        tasa_retencion_estimada_pct: retencion,
        clv_promedio_bs: Math.round((clvTotal / (clasif.length || 1)) * 10) / 10,
        fallback: false,
      };
    }

    // 3. Fallback Heurístico
    this.logger.warn('Microservicio ML offline: calculando clustering RFM heurístico');
    const clasifHeuristic: ItemClientaRfmDto[] = clientasDb.map((c) => {
      let seg: 'VIPS_LEALES' | 'POTENCIALES_NUEVAS' | 'EN_RIESGO_DORMIDAS' | 'OCASIONALES_OUTLET' = 'OCASIONALES_OUTLET';
      let clId = 3;
      let est = 'Campaña de liquidación de temporada';

      if (Number(c.monetary_cents) > 350000 && c.frequency_compras >= 6) {
        seg = 'VIPS_LEALES';
        clId = 0;
        est = 'Acceso prioritario y atención personalizada en probador';
      } else if (c.recency_dias < 30 && c.frequency_compras <= 3) {
        seg = 'POTENCIALES_NUEVAS';
        clId = 1;
        est = 'Campaña de bienvenida con cupón de 2da compra';
      } else if (c.recency_dias > 80 && Number(c.monetary_cents) > 150000) {
        seg = 'EN_RIESGO_DORMIDAS';
        clId = 2;
        est = "Campaña de rescate 'Te extrañamos en Tiendaria'";
      }

      return {
        clienta_id: c.clienta_id,
        cliente_nombre: c.cliente_nombre,
        recency_dias: c.recency_dias,
        frequency_compras: c.frequency_compras,
        monetary_cents: Number(c.monetary_cents),
        cluster_id: clId,
        segmento: seg,
        clv_estimado_bs: Math.round((Number(c.monetary_cents) / 100) * 1.3),
        estrategia_sugerida: est,
      };
    });

    const distribucion = clasifHeuristic.reduce<Record<string, number>>((acc, c) => {
      acc[c.segmento] = (acc[c.segmento] ?? 0) + 1;
      return acc;
    }, {});

    return {
      total_clientas: clasifHeuristic.length,
      distribucion_clusters: distribucion,
      clientas_clasificadas: clasifHeuristic,
      tasa_retencion_estimada_pct:
        Math.round((((distribucion.VIPS_LEALES ?? 0) + (distribucion.POTENCIALES_NUEVAS ?? 0)) / clasifHeuristic.length) * 1000) / 10,
      clv_promedio_bs:
        Math.round((clasifHeuristic.reduce((a, c) => a + c.clv_estimado_bs, 0) / clasifHeuristic.length) * 10) / 10,
      fallback: true,
    };
  }

  // =========================================================================
  // M4: DETECCIÓN DE TRANSACCIONES ANÓMALAS
  // =========================================================================
  async obtenerKpisAnomalias(_user: JwtPayload): Promise<AnomaliasMlResponseDto> {
    const tenantId = tenantActual();

    // 1. Últimas ventas, con el medio de pago real (vive en `pagos`, no en `ventas`).
    const ventasDb = (await this.dataSource.query(
      `SELECT
        v.id::text AS venta_id,
        v.total_cents::bigint AS monto_total_cents,
        COALESCE(v.descuento_cents, 0)::bigint AS descuento_cents,
        EXTRACT(HOUR FROM (v."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'America/La_Paz'))::int AS hora_venta,
        COALESCE((
          SELECT CASE p.metodo WHEN 'QR' THEN 'WAYRA_QR' ELSE p.metodo END
          FROM pagos p WHERE p.venta_id = v.id AND p.tenant_id = $1 AND p.estado = 'APROBADO'
          LIMIT 1
        ), 'EFECTIVO') AS metodo_pago,
        (SELECT COALESCE(SUM(vi.cantidad), 0)::int FROM venta_items vi WHERE vi.venta_id = v.id) AS cantidad_items
      FROM ventas v
      WHERE v.tenant_id = $1 AND v.estado <> 'CANCELADA'
      ORDER BY v."createdAt" DESC
      LIMIT 100;`,
      [tenantId],
    )) as VentaDb[];

    if (ventasDb.length === 0) {
      return {
        total_analizadas: 0,
        anomalias_detectadas: 0,
        tasa_anomalias_pct: 0,
        monto_sospechoso_cents: 0,
        diagnosticos: [],
        fallback: false,
      };
    }

    const payload = {
      tenant_id: tenantId,
      transacciones: ventasDb.map((v) => {
        const subtotal = Number(v.monto_total_cents) + Number(v.descuento_cents);
        const ratio = subtotal > 0 ? Number(v.descuento_cents) / subtotal : 0.0;
        return {
          venta_id: v.venta_id,
          monto_total_cents: Number(v.monto_total_cents),
          cantidad_items: v.cantidad_items || 1,
          hora_venta: v.hora_venta,
          descuento_cents: Number(v.descuento_cents),
          ratio_descuento: Math.round(ratio * 1000) / 1000,
          metodo_pago: v.metodo_pago || 'WAYRA_QR',
        };
      }),
    };

    // 2. Inferencia en microservicio
    const { data: mlResponse } = await this.fetchMl<any>(
      '/predict/anomalias',
      'POST',
      payload,
    );

    if (mlResponse && mlResponse.diagnosticos) {
      const diag = mlResponse.diagnosticos.map((d: any, idx: number) => ({
        ...d,
        monto_total_cents: ventasDb[idx]?.monto_total_cents,
        descuento_cents: ventasDb[idx]?.descuento_cents,
        hora_venta: ventasDb[idx]?.hora_venta,
        metodo_pago: ventasDb[idx]?.metodo_pago,
      }));

      const anomCount = diag.filter((d: any) => d.es_anomalo).length;
      const sospechoso = diag
        .filter((d: any) => d.es_anomalo)
        .reduce((acc: number, curr: any) => acc + Number(curr.monto_total_cents || 0), 0);

      return {
        total_analizadas: diag.length,
        anomalias_detectadas: anomCount,
        tasa_anomalias_pct: Math.round((anomCount / (diag.length || 1)) * 1000) / 10,
        monto_sospechoso_cents: sospechoso,
        diagnosticos: diag,
        fallback: false,
      };
    }

    // 3. Fallback Heurístico
    this.logger.warn('Microservicio ML offline: ejecutando auditoría de anomalías heurística');
    const diagHeuristic: ItemDiagnosticoAnomaliaDto[] = ventasDb.map((v) => {
      const isSusp = Number(v.descuento_cents) > 30000 || v.hora_venta < 6;
      return {
        venta_id: v.venta_id,
        monto_total_cents: Number(v.monto_total_cents),
        descuento_cents: Number(v.descuento_cents),
        hora_venta: v.hora_venta,
        metodo_pago: v.metodo_pago,
        score_anomalia: isSusp ? -0.22 : 0.16,
        es_anomalo: isSusp,
        nivel_riesgo: isSusp ? 'CRITICO' : 'NORMAL',
        motivo_sospecha: isSusp ? 'Descuento elevado o transacción fuera de horario comercial' : null,
      };
    });

    const totalAnom = diagHeuristic.filter((d) => d.es_anomalo).length;

    return {
      total_analizadas: diagHeuristic.length,
      anomalias_detectadas: totalAnom,
      tasa_anomalias_pct: Math.round((totalAnom / diagHeuristic.length) * 1000) / 10,
      monto_sospechoso_cents: diagHeuristic
        .filter((d) => d.es_anomalo)
        .reduce((a, d) => a + Number(d.monto_total_cents ?? 0), 0),
      diagnosticos: diagHeuristic,
      fallback: true,
    };
  }

  // =========================================================================
  // FICHA TÉCNICA Y MÉTRICAS CIENTÍFICAS
  // =========================================================================
  async obtenerMetricasModelos(): Promise<MetricasModelosMlResponseDto> {
    const { data: mlResponse } = await this.fetchMl<any>('/metrics/evaluacion', 'GET');

    if (mlResponse && mlResponse.modelos) {
      return {
        ...mlResponse,
        fallback: false,
      };
    }

    // Ficha científica canónica de respaldo con citas académicas
    return {
      fecha_evaluacion: new Date().toISOString(),
      semilla_reproducible: 42,
      dataset_size_total: 10000,
      modelos: {
        M1_demanda_random_forest: {
          tipo: 'Supervisado (Regresión)',
          algoritmo: 'RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)',
          cita_academica: 'Breiman, L. (2001). Random Forests. Machine Learning, 45(1), 5-32.',
          metricas: { r2_score: 0.9566, mae: 1.91, rmse: 2.47 },
          kpi_asociado: 'Quiebres de Stock (Stockout Rate) y Rotación de Inventario',
        },
        M2_noshow_logistic_regression: {
          tipo: 'Supervisado (Clasificación)',
          algoritmo: 'LogisticRegression(penalty=l2, C=1.0, class_weight=balanced, random_state=42)',
          cita_academica: 'Cox, D. R. (1958). The Regression Analysis of Binary Sequences. JRSS-B, 20(2), 215-232.',
          metricas: { roc_auc: 0.7978, f1_score: 0.744, precision: 0.7817, recall: 0.7098 },
          kpi_asociado: 'Tasa de No-Show y Conversión de Reserva a Venta',
        },
        M3_rfm_kmeans: {
          tipo: 'No Supervisado (Clustering)',
          algoritmo: 'KMeans(n_clusters=4, init=k-means++, random_state=42)',
          cita_academica: 'MacQueen, J. (1967). Some Methods for classification and Analysis of Multivariate Observations. 5th Berkeley Symposium, 1, 281-297.',
          metricas: { silhouette_score: 0.6823, inercia_wcss: 509.67 },
          kpi_asociado: 'Tasa de Retención de Clientas y Valor de Vida (CLV)',
        },
        M4_anomalias_isolation_forest: {
          tipo: 'No Supervisado (Detección de Anomalías)',
          algoritmo: 'IsolationForest(contamination=0.03, n_estimators=100, random_state=42)',
          cita_academica: 'Liu, F. T., Ting, K. M., & Zhou, Z.-H. (2008). Isolation Forest. IEEE ICDM, 413-422.',
          metricas: { tasa_contaminacion_esperada: 0.03, anomalias_identificadas_test: 300, score_medio_normales: 0.1573, score_medio_anomalos: -0.0498 },
          kpi_asociado: 'Reducción de Merma, Fraude y Errores de Caja POS',
        },
      },
      fallback: true,
    };
  }
}
