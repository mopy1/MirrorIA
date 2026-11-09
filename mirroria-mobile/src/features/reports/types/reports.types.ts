/** Mismo contrato que la web (`mirroria-frontend/src/features/reports/types`). */

export interface FilaReporte {
  clave: string;
  etiqueta: string;
  valor: number;
  valorProyectado?: number;
  valorOriginal?: number;
  detalles?: Record<string, unknown>;
}

export interface Variacion {
  clave: string;
  etiqueta: string;
  actual: number;
  anterior: number;
  deltaAbsoluto: number;
  /** null cuando el período anterior fue 0: el porcentaje no existe. */
  deltaPorcentual: number | null;
}

export interface Comparacion {
  rango: { desde: string; hasta: string };
  filas: FilaReporte[];
  variaciones: Variacion[];
}

export interface Ficha {
  metrica: string;
  agruparPor: string;
  filtros: Record<string, string | undefined>;
  campoFecha?: 'creacion' | 'prevista';
  compararCon?: { desde: string; hasta: string };
  orden: 'asc' | 'desc';
  limite: number;
}

export interface PasoEjecutado {
  paso: number;
  herramienta: string;
  argumentos: Record<string, unknown>;
  resultadoResumen: string;
}

export interface Reporte {
  ficha: Ficha;
  filas: FilaReporte[];
  comparacion: Comparacion | null;
  narrativa: string | null;
  pasosEjecutados?: PasoEjecutado[];
  esSimulacion?: boolean;
  tipoGraficoSugerido?: string;
}

/** Respuesta de `POST /ia/reportes/hibrido`. */
export interface ReporteHibridoResponse {
  preguntaOriginal: string;
  narrativa: string;
  filas: { etiqueta: string; valor: number; valorProyectado?: number; valorOriginal?: number; detalles?: Record<string, unknown> }[];
  pasosEjecutados: PasoEjecutado[];
  esSimulacion: boolean;
  tipoGraficoSugerido?: string;
  metrica?: string;
}

export type FormatoReporte = 'pdf' | 'excel';

export type TonoMensaje = 'normal' | 'aclaracion' | 'error';

export interface MensajeChat {
  id: string;
  rol: 'usuario' | 'asistente';
  texto: string;
  tono?: TonoMensaje;
  /** Reporte que generó este mensaje (botón "Ver reporte"). */
  reporteId?: string;
  pregunta?: string;
  reintentable?: boolean;
  sugerencias?: string[];
}

/** Un reporte abierto en la sesión (equivale a una pestaña de la web). */
export interface ReporteAbierto {
  id: string;
  titulo: string;
  /** Pregunta en lenguaje natural; no existe en los reportes del constructor. */
  pregunta?: string;
  reporte: Reporte;
  generadoEn: Date;
}

export interface OpcionSelector {
  id: string;
  label: string;
}
