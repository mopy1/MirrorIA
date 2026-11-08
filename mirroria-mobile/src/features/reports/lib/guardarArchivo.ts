import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { MIME, UTI } from './archivo';
import type { FormatoReporte } from '../types/reports.types';

/**
 * Teléfono: guarda el archivo en la caché de la app y abre el menú de compartir
 * (guardar en Archivos, mandar por WhatsApp, abrir en Excel…). En web se usa `guardarArchivo.web.ts`.
 */
export async function guardarArchivo(bytes: ArrayBuffer, nombre: string, formato: FormatoReporte): Promise<void> {
  const archivo = new File(Paths.cache, nombre);
  if (archivo.exists) archivo.delete();
  archivo.create();
  archivo.write(new Uint8Array(bytes));
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Este teléfono no deja compartir archivos. El reporte quedó guardado en la app.');
  }
  await Sharing.shareAsync(archivo.uri, { mimeType: MIME[formato], UTI: UTI[formato], dialogTitle: nombre });
}
