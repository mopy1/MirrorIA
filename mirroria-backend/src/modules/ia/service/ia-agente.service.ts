import { tenantActual } from '../../../core/tenancy/tenant-context.js';
import { Inject, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import type { FilaReporteHibridoDto, PasoEjecutadoDto, ReporteHibridoResponseDto } from '../dto/reporte-hibrido-response.dto.js';
import { FichaConsultaDto, FiltrosDto } from '../dto/ficha-consulta.dto.js';
import type { Dimension, Metrica } from './catalogo-metricas.js';
import { DuckDbService } from './duckdb.service.js';
import { IA_TOOLS } from './ia-tools.catalog.js';
import { MotorConsultaService } from './motor-consulta.service.js';
import { PROVEEDOR_IA, type MensajeIa, type ProveedorIa } from './proveedor-ia/proveedor-ia.interface.js';

@Injectable()
export class IaAgenteService {
  constructor(
    @Inject(PROVEEDOR_IA) private readonly proveedorIa: ProveedorIa,
    private readonly motorConsultaService: MotorConsultaService,
    private readonly duckDbService: DuckDbService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async ejecutar(pregunta: string, user: JwtPayload): Promise<ReporteHibridoResponseDto> {
    const hoy = new Date().toISOString().slice(0, 10);
    const mensajes: MensajeIa[] = [
      {
        role: 'system',
        content: `Eres el analista de datos ejecutivo de la tienda. Hoy es ${hoy}. Resuelve consultas complejas usando las herramientas disponibles. Para preguntas como "Top N productos más vendidos", usa 'consultar_metricas' con metrica='unidades' (o 'ingresos'), dimension='producto', limite=N, orden='desc'. Al terminar, entrega SIEMPRE una narrativa ejecutiva clara basada en los datos devueltos por las herramientas.`,
      },
      { role: 'user', content: pregunta },
    ];
    const pasosEjecutados: PasoEjecutadoDto[] = [];
    let filas: FilaReporteHibridoDto[] = [];
    let esSimulacion = false;
    let ultimaMetrica: string | undefined;
    let narrativa = '';

    for (let paso = 1; paso <= 3; paso++) {
      const res = await this.proveedorIa.chatearConTools?.(mensajes, IA_TOOLS);
      if (!res) break;
      if (!res.toolCalls?.length) {
        narrativa = res.contenido ?? '';
        break;
      }
      for (const tc of res.toolCalls) {
        const out = await this.ejecutarTool(tc.name, tc.arguments, filas, user);
        if (out.sim) esSimulacion = true;
        if (out.filas.length) filas = out.filas;
        if (out.metrica) ultimaMetrica = out.metrica;
        pasosEjecutados.push({ paso, herramienta: tc.name, argumentos: tc.arguments, resultadoResumen: out.resumen });
        mensajes.push({ role: 'assistant', tool_calls: [{ id: tc.id, type: 'function', function: { name: tc.name, arguments: JSON.stringify(tc.arguments) } }] });
        mensajes.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(out.datosParaIa) });
      }
    }
    return {
      preguntaOriginal: pregunta,
      narrativa: narrativa || 'Analisis completado.',
      filas,
      pasosEjecutados,
      esSimulacion,
      metrica: ultimaMetrica,
      tipoGraficoSugerido: this.inferirGrafico(filas, esSimulacion),
    };
  }

  private inferirGrafico(filas: FilaReporteHibridoDto[], esSimulacion: boolean): string {
    if (esSimulacion) return 'what-if-comparison';
    return filas.length > 5 ? 'bar-horizontal' : 'bar';
  }

  private async ejecutarTool(name: string, args: Record<string, unknown>, prevFilas: FilaReporteHibridoDto[], user: JwtPayload) {
    if (name === 'simular_what_if') {
      const base = prevFilas.length ? prevFilas : [{ etiqueta: 'Base General', valor: 10000 }];
      const proy = await this.duckDbService.proyectarWhatIf(base, Number(args.variacionPrecioPct) || 0, Number(args.variacionVolumenPct) || 0);
      const filas = proy.map((p) => ({ etiqueta: p.etiqueta, valor: p.valorProyectado, detalles: { original: p.valorOriginal, deltaAbs: p.deltaAbsoluto, deltaPct: p.deltaPorcentual } }));
      return { resumen: `Simulacion DuckDB: ${filas.length} escenarios proyectados.`, filas, datosParaIa: filas, sim: true, metrica: 'simular_what_if' };
    }
    if (name === 'consultar_proveedores_stock') {
      // Solo la tienda del contexto. `razon_social`: proveedores no tiene columna `nombre`.
      const sql = `SELECT COALESCE(p.razon_social, 'Sin Proveedor') as prov, oc.estado, oc.items FROM ordenes_compra oc LEFT JOIN proveedores p ON p.id = oc.proveedor_id WHERE oc.tenant_id = $1 LIMIT 10`;
      const raw = (await this.dataSource.query(sql, [tenantActual()])) as Array<{ prov: string; estado: string; items: Array<{ cantidadPedida: number; cantidadRecibida: number }> }>;
      const filas = raw.map((r, i) => {
        const pendiente = (r.items || []).reduce((acc, it) => acc + (it.cantidadPedida - (it.cantidadRecibida || 0)), 0);
        return { etiqueta: `${r.prov} (${r.estado}) #${i + 1}`, valor: pendiente, detalles: { estado: r.estado } };
      });
      return { resumen: `Se consultaron ${raw.length} ordenes de compra.`, filas, datosParaIa: filas, sim: false, metrica: 'stock_proveedores' };
    }
    const metrica = (args.metrica === 'ventas_totales' ? 'ingresos' : String(args.metrica || 'ingresos')) as Metrica;
    const agruparPor = String(args.dimension || 'ninguno') as Dimension;
    const limite = Math.min(100, Math.max(1, Number(args.limite) || 10));
    const orden = args.orden === 'asc' ? 'asc' : 'desc';
    const filtros = new FiltrosDto();
    if (args.fechaInicio) filtros.desde = String(args.fechaInicio);
    if (args.fechaFin) filtros.hasta = String(args.fechaFin);
    if (args.sucursalId) filtros.sucursalId = String(args.sucursalId);
    if (args.categoriaId) filtros.categoriaId = String(args.categoriaId);
    if (args.canal) filtros.canal = String(args.canal);
    if (user.role === 'ENCARGADO_SUCURSAL' && user.sucursalId) filtros.sucursalId = user.sucursalId;

    const ficha: FichaConsultaDto = { metrica, agruparPor, filtros, orden, limite };
    const res = await this.motorConsultaService.ejecutar(ficha);
    const filas = res.map((r) => ({ etiqueta: r.etiqueta, valor: r.valor }));
    return { resumen: `Metrica ${metrica} obtenida: ${filas.length} filas.`, filas, datosParaIa: filas, sim: false, metrica };
  }
}
