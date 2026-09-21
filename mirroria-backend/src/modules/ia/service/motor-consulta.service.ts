import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { FichaConsultaDto } from '../dto/ficha-consulta.dto.js';
import { CombinacionInvalidaException } from '../exception/combinacion-invalida.exception.js';
import { CATALOGO_METRICAS, type NombreFiltro } from './catalogo-metricas.js';

export interface FilaReporte {
  clave: string;
  etiqueta: string;
  valor: number;
}

@Injectable()
export class MotorConsultaService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async ejecutar(ficha: FichaConsultaDto, rango?: { desde: string; hasta: string }): Promise<FilaReporte[]> {
    const def = CATALOGO_METRICAS[ficha.metrica];
    if (!def) {
      throw new CombinacionInvalidaException(`la metrica "${ficha.metrica}" no existe`);
    }
    const dim = def.dimensiones[ficha.agruparPor];
    if (!dim) {
      throw new CombinacionInvalidaException(
        `la metrica "${ficha.metrica}" no se puede agrupar por "${ficha.agruparPor}"`,
      );
    }

    const params: unknown[] = [];
    const condiciones: string[] = [];
    const filtros = ficha.filtros ?? {};

    // 1. Filtros declarados en el catalogo.
    for (const [nombre, valor] of Object.entries(filtros)) {
      if (valor === undefined || nombre === 'desde' || nombre === 'hasta') continue;
      const plantilla = def.filtros[nombre as NombreFiltro];
      if (!plantilla) {
        throw new CombinacionInvalidaException(
          `la metrica "${ficha.metrica}" no admite el filtro "${nombre}"`,
        );
      }
      if (nombre === 'estado' && def.estadoValido && !def.estadoValido.includes(String(valor))) {
        throw new CombinacionInvalidaException(
          `"${String(valor)}" no es un estado valido para "${ficha.metrica}"`,
        );
      }
      params.push(valor);
      condiciones.push(plantilla.replace('$', `$${params.length}`));
    }

    // 2. Estado por defecto: solo si la ficha no pidio uno.
    if (def.filtroEstadoPorDefecto && filtros.estado === undefined) {
      condiciones.push(def.filtroEstadoPorDefecto);
    }

    // 3. Rango de fechas. `rango` (comparacion) pisa al de los filtros.
    const desde = rango?.desde ?? filtros.desde;
    const hasta = rango?.hasta ?? filtros.hasta;

    if (ficha.campoFecha && !def.columnaFechaAlterna) {
      throw new CombinacionInvalidaException(
        `la metrica "${ficha.metrica}" no tiene un campo de fecha alternativo`,
      );
    }
    const columnaFecha =
      ficha.campoFecha === 'prevista' ? def.columnaFechaAlterna : def.columnaFecha;

    if ((desde || hasta) && !columnaFecha) {
      throw new CombinacionInvalidaException(
        `la metrica "${ficha.metrica}" no tiene dimension temporal: no admite filtro de fechas`,
      );
    }
    if (desde && columnaFecha) {
      params.push(desde);
      condiciones.push(`${columnaFecha} >= $${params.length}`);
    }
    if (hasta && columnaFecha) {
      params.push(hasta);
      // `< hasta + 1 dia`, NUNCA `<= hasta`. Las fechas llegan en YYYY-MM-DD (asi se
      // las pide la instruccion del modelo) y las columnas son `timestamp`: con `<=`,
      // Postgres compara contra la MEDIANOCHE del ultimo dia y descarta el dia entero
      // (`'2026-08-31 16:45' <= '2026-08-31'` es falso). En "cuanto vendi este mes"
      // eso borra el dia de hoy. La forma `< ($n::date + INTERVAL '1 day')` incluye el
      // dia completo y funciona igual si la columna es `date` o `timestamp`.
      condiciones.push(`${columnaFecha} < ($${params.length}::date + INTERVAL '1 day')`);
    }

    // 4. Joins, sin duplicar.
    const joins = [...new Set([...def.joinsBase, ...dim.joins])];

    // 5. Agregacion. La dimension puede cambiarla: agrupar por categoria/producto
    // obliga a joinear venta_items, y con ese join una suma sobre la CABECERA de la
    // venta cuenta el total entero una vez por linea. Ver DimensionSpec.seleccionAlterna.
    const seleccion = dim.seleccionAlterna ?? def.seleccion;

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const agrupa = ficha.agruparPor === 'ninguno' ? '' : `GROUP BY ${dim.grupo}, ${dim.etiqueta}`;

    params.push(ficha.limite);
    const sql = `
      SELECT ${dim.grupo}::text AS clave, ${dim.etiqueta}::text AS etiqueta, ${seleccion} AS valor
      FROM ${def.from}
      ${joins.join('\n      ')}
      ${where}
      ${agrupa}
      ORDER BY valor ${ficha.orden === 'asc' ? 'ASC' : 'DESC'}
      LIMIT $${params.length}
    `;

    const filas = (await this.dataSource.query(sql, params)) as Array<Record<string, string>>;
    return filas.map((f) => ({
      clave: f.clave ?? '',
      etiqueta: f.etiqueta ?? '',
      // El driver pg devuelve bigint/numeric como string. Ver AGENTS.md, productos.precioCents.
      valor: Number(f.valor),
    }));
  }
}
