import { Inject, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { JwtPayload } from '../../../core/security/jwt-payload.interface.js';
import type { FilaReporteHibridoDto, PasoEjecutadoDto, ReporteHibridoResponseDto } from '../dto/reporte-hibrido-response.dto.js';
import { FichaConsultaDto } from '../dto/ficha-consulta.dto.js';
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

  async ejecutar(pregunta: string, _user: JwtPayload): Promise<ReporteHibridoResponseDto> {
    const mensajes: MensajeIa[] = [
      { role: 'system', content: 'Eres el analista de datos de MirrorIA. Resuelve consultas complejas usando herramientas y devuelve una explicacion concisa.' },
      { role: 'user', content: pregunta },
    ];
    const pasosEjecutados: PasoEjecutadoDto[] = [];
    let filas: FilaReporteHibridoDto[] = [];
    let esSimulacion = false;
    let narrativa = '';

    for (let paso = 1; paso <= 3; paso++) {
      const res = await this.proveedorIa.chatearConTools?.(mensajes, IA_TOOLS);
      if (!res) break;
      if (!res.toolCalls?.length) {
        narrativa = res.contenido ?? 'Consulta analitica finalizada con exito.';
        break;
      }
      for (const tc of res.toolCalls) {
        const out = await this.ejecutarTool(tc.name, tc.arguments, filas);
        if (out.sim) esSimulacion = true;
        if (out.filas.length) filas = out.filas;
        pasosEjecutados.push({ paso, herramienta: tc.name, argumentos: tc.arguments, resultadoResumen: out.resumen });
        mensajes.push({ role: 'assistant', tool_calls: [{ id: tc.id, type: 'function', function: { name: tc.name, arguments: JSON.stringify(tc.arguments) } }] });
        mensajes.push({ role: 'tool', tool_call_id: tc.id, content: out.resumen });
      }
    }
    return { preguntaOriginal: pregunta, narrativa: narrativa || 'Analisis completado.', filas, pasosEjecutados, esSimulacion };
  }

  private async ejecutarTool(name: string, args: Record<string, unknown>, prevFilas: FilaReporteHibridoDto[]) {
    if (name === 'simular_what_if') {
      const base = prevFilas.length ? prevFilas : [{ etiqueta: 'Base General', valor: 10000 }];
      const proy = await this.duckDbService.proyectarWhatIf(base, Number(args.variacionPrecioPct) || 0, Number(args.variacionVolumenPct) || 0);
      const filas = proy.map((p) => ({ etiqueta: p.etiqueta, valor: p.valorProyectado, detalles: { original: p.valorOriginal, deltaAbs: p.deltaAbsoluto, deltaPct: p.deltaPorcentual } }));
      return { resumen: `Simulacion DuckDB: ${filas.length} escenarios proyectados.`, filas, sim: true };
    }
    if (name === 'consultar_proveedores_stock') {
      const sql = `SELECT COALESCE(p.nombre, 'Sin Proveedor') as prov, oc.estado, oc.items FROM ordenes_compra oc LEFT JOIN proveedores p ON p.id = oc.proveedor_id LIMIT 10`;
      const raw = (await this.dataSource.query(sql)) as Array<{ prov: string; estado: string; items: Array<{ cantidadPedida: number; cantidadRecibida: number }> }>;
      const filas = raw.map((r, i) => {
        const pendiente = (r.items || []).reduce((acc, it) => acc + (it.cantidadPedida - (it.cantidadRecibida || 0)), 0);
        return { etiqueta: `${r.prov} (${r.estado}) #${i + 1}`, valor: pendiente, detalles: { estado: r.estado } };
      });
      return { resumen: `Se consultaron ${raw.length} ordenes de compra.`, filas, sim: false };
    }
    const metrica = (args.metrica === 'ventas_totales' ? 'ingresos' : String(args.metrica || 'ingresos')) as Metrica;
    const agruparPor = String(args.dimension || 'ninguno') as Dimension;
    const ficha: FichaConsultaDto = {
      metrica,
      agruparPor,
      filtros: {},
      orden: 'desc',
      limite: 20,
    };
    const res = await this.motorConsultaService.ejecutar(ficha);
    const filas = res.map((r) => ({ etiqueta: r.etiqueta, valor: r.valor }));
    return { resumen: `Metrica ${metrica} obtenida: ${filas.length} filas.`, filas, sim: false };
  }
}
