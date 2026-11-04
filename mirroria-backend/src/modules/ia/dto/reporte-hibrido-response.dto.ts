export class FilaReporteHibridoDto {
  etiqueta!: string;
  valor!: number;
  detalles?: Record<string, unknown>;
}

export class PasoEjecutadoDto {
  paso!: number;
  herramienta!: string;
  argumentos!: Record<string, unknown>;
  resultadoResumen!: string;
}

export class ReporteHibridoResponseDto {
  preguntaOriginal!: string;
  narrativa!: string;
  filas!: FilaReporteHibridoDto[];
  pasosEjecutados!: PasoEjecutadoDto[];
  esSimulacion!: boolean;
  metrica?: string;
  tipoGraficoSugerido?: string;
}
