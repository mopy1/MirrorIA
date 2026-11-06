import { BadRequestException, Injectable } from '@nestjs/common';
import { PeriodoDashboard } from '../dto/filtro-dashboard-ejecutivo.dto.js';

export interface IntervaloPeriodo {
  clave: string;
  desde: Date;
  hasta: Date;
  anteriorDesde: Date;
  anteriorHasta: Date;
  dias: number;
}

export interface DeltaCalculado {
  variacionPorcentaje: number;
  tendencia: 'POSITIVA' | 'NEGATIVA' | 'NEUTRA';
}

@Injectable()
export class PeriodosService {
  private readonly formatterFecha = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/La_Paz',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  private readonly formatterHora = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/La_Paz',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  /**
   * Obtiene la fecha actual formateada en YYYY-MM-DD según la zona horaria America/La_Paz (UTC-4).
   */
  obtenerHoyLaPaz(referencia: Date = new Date()): { hoyStr: string; inicioHoy: Date; finHoy: Date } {
    const hoyStr = this.formatterFecha.format(referencia);
    const inicioHoy = new Date(`${hoyStr}T00:00:00.000-04:00`);
    const finHoy = new Date(`${hoyStr}T23:59:59.999-04:00`);
    return { hoyStr, inicioHoy, finHoy };
  }

  /**
   * Formatea una fecha en YYYY-MM-DD en America/La_Paz.
   */
  formatearFechaLaPaz(fecha: Date): string {
    return this.formatterFecha.format(fecha);
  }

  /**
   * Formatea una hora en HH:mm en America/La_Paz.
   */
  formatearHoraLaPaz(fecha: Date): string {
    return this.formatterHora.format(fecha);
  }

  /**
   * Calcula los minutos faltantes para una cita respecto a ahora.
   * Si ya pasó o está en curso, devuelve 0.
   */
  minutosParaCita(fechaCita: Date, referencia: Date = new Date()): number {
    const diffMs = fechaCita.getTime() - referencia.getTime();
    const minutos = Math.round(diffMs / 60000);
    return minutos > 0 ? minutos : 0;
  }

  /**
   * Calcula el rango de fechas actual y el comparativo simétrico anterior
   * según la zona horaria determinista America/La_Paz.
   */
  calcularRango(
    periodo: PeriodoDashboard = PeriodoDashboard.TREINTA_DIAS,
    fechaInicio?: string,
    fechaFin?: string,
    referencia: Date = new Date(),
  ): IntervaloPeriodo {
    const hoyStr = this.formatterFecha.format(referencia);
    const hoyDateParts = hoyStr.split('-').map(Number);
    const anio = hoyDateParts[0];
    const mes = hoyDateParts[1]; // 1-12
    const dia = hoyDateParts[2];

    let desde: Date;
    let hasta: Date;
    let anteriorDesde: Date;
    let anteriorHasta: Date;
    let dias: number;

    switch (periodo) {
      case PeriodoDashboard.HOY: {
        dias = 1;
        desde = new Date(`${hoyStr}T00:00:00.000-04:00`);
        hasta = new Date(`${hoyStr}T23:59:59.999-04:00`);

        const ayerRef = new Date(desde.getTime() - 12 * 3600000);
        const ayerStr = this.formatterFecha.format(ayerRef);
        anteriorDesde = new Date(`${ayerStr}T00:00:00.000-04:00`);
        anteriorHasta = new Date(`${ayerStr}T23:59:59.999-04:00`);
        break;
      }

      case PeriodoDashboard.SIETE_DIAS: {
        dias = 7;
        hasta = new Date(`${hoyStr}T23:59:59.999-04:00`);
        const hace6DiasRef = new Date(hasta.getTime() - 6 * 86400000);
        const desdeStr = this.formatterFecha.format(hace6DiasRef);
        desde = new Date(`${desdeStr}T00:00:00.000-04:00`);

        anteriorHasta = new Date(desde.getTime() - 1);
        const anteriorHastaStr = this.formatterFecha.format(anteriorHasta);
        const hace13DiasRef = new Date(desde.getTime() - 7 * 86400000);
        const anteriorDesdeStr = this.formatterFecha.format(hace13DiasRef);
        anteriorDesde = new Date(`${anteriorDesdeStr}T00:00:00.000-04:00`);
        break;
      }

      case PeriodoDashboard.TREINTA_DIAS: {
        dias = 30;
        hasta = new Date(`${hoyStr}T23:59:59.999-04:00`);
        const hace29DiasRef = new Date(hasta.getTime() - 29 * 86400000);
        const desdeStr = this.formatterFecha.format(hace29DiasRef);
        desde = new Date(`${desdeStr}T00:00:00.000-04:00`);

        anteriorHasta = new Date(desde.getTime() - 1);
        const hace59DiasRef = new Date(desde.getTime() - 30 * 86400000);
        const anteriorDesdeStr = this.formatterFecha.format(hace59DiasRef);
        anteriorDesde = new Date(`${anteriorDesdeStr}T00:00:00.000-04:00`);
        break;
      }

      case PeriodoDashboard.MES_ACTUAL: {
        const mesPad = String(mes).padStart(2, '0');
        const ultimoDiaMes = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
        const ultimoDiaPad = String(ultimoDiaMes).padStart(2, '0');

        desde = new Date(`${anio}-${mesPad}-01T00:00:00.000-04:00`);
        hasta = new Date(`${anio}-${mesPad}-${ultimoDiaPad}T23:59:59.999-04:00`);
        dias = ultimoDiaMes;

        // Mes anterior completo
        const anioAnt = mes === 1 ? anio - 1 : anio;
        const mesAnt = mes === 1 ? 12 : mes - 1;
        const mesAntPad = String(mesAnt).padStart(2, '0');
        const ultimoDiaMesAnt = new Date(Date.UTC(anioAnt, mesAnt, 0)).getUTCDate();
        const ultimoDiaMesAntPad = String(ultimoDiaMesAnt).padStart(2, '0');

        anteriorDesde = new Date(`${anioAnt}-${mesAntPad}-01T00:00:00.000-04:00`);
        anteriorHasta = new Date(`${anioAnt}-${mesAntPad}-${ultimoDiaMesAntPad}T23:59:59.999-04:00`);
        break;
      }

      case PeriodoDashboard.MES_ANTERIOR: {
        const anioAnt = mes === 1 ? anio - 1 : anio;
        const mesAnt = mes === 1 ? 12 : mes - 1;
        const mesAntPad = String(mesAnt).padStart(2, '0');
        const ultimoDiaMesAnt = new Date(Date.UTC(anioAnt, mesAnt, 0)).getUTCDate();
        const ultimoDiaMesAntPad = String(ultimoDiaMesAnt).padStart(2, '0');

        desde = new Date(`${anioAnt}-${mesAntPad}-01T00:00:00.000-04:00`);
        hasta = new Date(`${anioAnt}-${mesAntPad}-${ultimoDiaMesAntPad}T23:59:59.999-04:00`);
        dias = ultimoDiaMesAnt;

        // Dos meses atrás
        const anio2Ant = mesAnt === 1 ? anioAnt - 1 : anioAnt;
        const mes2Ant = mesAnt === 1 ? 12 : mesAnt - 1;
        const mes2AntPad = String(mes2Ant).padStart(2, '0');
        const ultimoDiaMes2Ant = new Date(Date.UTC(anio2Ant, mes2Ant, 0)).getUTCDate();
        const ultimoDiaMes2AntPad = String(ultimoDiaMes2Ant).padStart(2, '0');

        anteriorDesde = new Date(`${anio2Ant}-${mes2AntPad}-01T00:00:00.000-04:00`);
        anteriorHasta = new Date(`${anio2Ant}-${mes2AntPad}-${ultimoDiaMes2AntPad}T23:59:59.999-04:00`);
        break;
      }

      case PeriodoDashboard.PERSONALIZADO: {
        if (!fechaInicio || !fechaFin) {
          throw new BadRequestException('fechaInicio y fechaFin son requeridos para periodo personalizado');
        }
        if (fechaInicio > fechaFin) {
          throw new BadRequestException('fechaInicio no puede ser posterior a fechaFin');
        }

        desde = new Date(`${fechaInicio}T00:00:00.000-04:00`);
        hasta = new Date(`${fechaFin}T23:59:59.999-04:00`);

        const diffMs = hasta.getTime() - desde.getTime();
        dias = Math.max(1, Math.round(diffMs / 86400000));

        anteriorHasta = new Date(desde.getTime() - 1);
        anteriorDesde = new Date(anteriorHasta.getTime() - diffMs);
        break;
      }

      default:
        throw new BadRequestException(`Periodo no soportado: ${periodo}`);
    }

    return {
      clave: periodo,
      desde,
      hasta,
      anteriorDesde,
      anteriorHasta,
      dias,
    };
  }

  /**
   * Genera la lista completa de fechas 'YYYY-MM-DD' en America/La_Paz entre dos instantes.
   */
  generarSerieDias(desde: Date, hasta: Date): string[] {
    const lista: string[] = [];
    const d = new Date(desde);
    while (d.getTime() <= hasta.getTime()) {
      const diaStr = this.formatterFecha.format(d);
      if (!lista.includes(diaStr)) {
        lista.push(diaStr);
      }
      d.setTime(d.getTime() + 24 * 60 * 60 * 1000);
    }
    return lista;
  }

  /**
   * Calcula la variación porcentual entre el valor actual y el anterior.
   * Maneja divisiones por cero determinísticamente (según la especificación D4 / §1.1 A).
   */
  calcularDelta(actual: number, anterior: number): DeltaCalculado {
    if (anterior > 0) {
      const raw = ((actual - anterior) / anterior) * 100;
      const variacionPorcentaje = Math.round(raw * 100) / 100;
      return {
        variacionPorcentaje,
        tendencia: variacionPorcentaje > 0 ? 'POSITIVA' : variacionPorcentaje < 0 ? 'NEGATIVA' : 'NEUTRA',
      };
    }

    if (anterior === 0 && actual > 0) {
      return {
        variacionPorcentaje: 100.0,
        tendencia: 'POSITIVA',
      };
    }

    if (anterior === 0 && actual < 0) {
      return {
        variacionPorcentaje: -100.0,
        tendencia: 'NEGATIVA',
      };
    }

    return {
      variacionPorcentaje: 0.0,
      tendencia: 'NEUTRA',
    };
  }
}
