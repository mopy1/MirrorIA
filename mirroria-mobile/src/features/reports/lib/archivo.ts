import type { FormatoReporte, Reporte } from '../types/reports.types';

const EXTENSION: Record<FormatoReporte, string> = { pdf: 'pdf', excel: 'xlsx' };

export const MIME: Record<FormatoReporte, string> = {
  pdf: 'application/pdf',
  excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

/** UTI de iOS para el menú de compartir. */
export const UTI: Record<FormatoReporte, string> = {
  pdf: 'com.adobe.pdf',
  excel: 'org.openxmlformats.spreadsheetml.sheet',
};

export const RUTA_EXPORTAR: Record<FormatoReporte, string> = {
  pdf: '/ia/reportes/exportar-pdf',
  excel: '/ia/reportes/exportar-excel',
};

/** Nombre legible a partir del título (igual que la web): "top-5-productos-mas-vendidos_2026-11-06.xlsx". */
export function nombreArchivoReporte(titulo: string, formato: FormatoReporte, fecha = new Date()): string {
  const slug = titulo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return `${slug || 'reporte'}_${fecha.toISOString().slice(0, 10)}.${EXTENSION[formato]}`;
}

export interface PayloadExportacion {
  titulo: string;
  ficha: Reporte['ficha'];
  filas: Reporte['filas'];
  comparacion: Reporte['comparacion'];
}

/** Lo mismo que manda la web (`descargarReporte`): el backend recalcula las filas con la ficha. */
export function payloadExportacion(reporte: Reporte, titulo: string): PayloadExportacion {
  return { ficha: reporte.ficha, filas: reporte.filas, comparacion: reporte.comparacion, titulo };
}
