import { useState } from 'react';
import { ApiError } from '@/src/lib/api';
import { reportsApi } from '../api/reportsApi';
import { nombreArchivoReporte, payloadExportacion } from '../lib/archivo';
import { guardarArchivo } from '../lib/guardarArchivo';
import type { FormatoReporte, Reporte } from '../types/reports.types';

/** Pide el archivo al backend (mismos endpoints y cuerpo que la web) y lo comparte o descarga. */
export async function exportarReporte(reporte: Reporte, titulo: string, formato: FormatoReporte): Promise<void> {
  const bytes = await reportsApi.exportar(formato, payloadExportacion(reporte, titulo));
  if (bytes.byteLength === 0) throw new Error('El servidor devolvió un archivo vacío. Probá de nuevo.');
  await guardarArchivo(bytes, nombreArchivoReporte(titulo, formato), formato);
}

export function useExportar() {
  const [exportando, setExportando] = useState<FormatoReporte | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function exportar(reporte: Reporte, titulo: string, formato: FormatoReporte) {
    setExportando(formato);
    setError(null);
    try {
      await exportarReporte(reporte, titulo, formato);
    } catch (e) {
      setError(e instanceof ApiError || e instanceof Error ? e.message : 'No se pudo generar el archivo. Probá de nuevo en un momento.');
    } finally {
      setExportando(null);
    }
  }

  return { exportar, exportando, error };
}
