import { MIME } from './archivo';
import type { FormatoReporte } from '../types/reports.types';

/** Navegador: descarga normal (igual que la web). */
export async function guardarArchivo(bytes: ArrayBuffer, nombre: string, formato: FormatoReporte): Promise<void> {
  const url = URL.createObjectURL(new Blob([bytes], { type: MIME[formato] }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
