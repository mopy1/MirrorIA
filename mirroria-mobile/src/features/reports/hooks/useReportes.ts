import { useRef, useState } from 'react';
import { ApiError } from '@/src/lib/api';
import { reportsApi } from '../api/reportsApi';
import { tituloConstructor } from '../lib/constructor';
import { describirFallo, formatoPedido, mapHibridoAReporte, respuestaMeta, textoReporteListo, tituloDesdeTexto } from '../lib/chat';
import type { FormatoReporte, MensajeChat, Reporte, ReporteAbierto } from '../types/reports.types';

/**
 * Conversación con la IA + reportes abiertos en la sesión (las "pestañas" de la web).
 * `alPedirArchivo` se llama cuando la pregunta pedía el archivo ("…en pdf").
 */
export function useReportes(alPedirArchivo?: (r: ReporteAbierto, formato: FormatoReporte) => void) {
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [abiertos, setAbiertos] = useState<ReporteAbierto[]>([]);
  const [activoId, setActivoId] = useState<string | null>(null);
  const [pensando, setPensando] = useState(false);
  const contador = useRef(0);
  const nuevoId = () => `r${Date.now()}-${++contador.current}`;

  const agregar = (m: Omit<MensajeChat, 'id'>) => setMensajes((prev) => [...prev, { ...m, id: nuevoId() }]);

  function abrir(reporte: Reporte, titulo: string, pregunta?: string): ReporteAbierto {
    const nuevo: ReporteAbierto = { id: nuevoId(), titulo, pregunta, reporte, generadoEn: new Date() };
    setAbiertos((prev) => [...prev, nuevo]);
    setActivoId(nuevo.id);
    return nuevo;
  }

  async function preguntar(textoCrudo: string) {
    const texto = textoCrudo.trim();
    if (texto.length < 3 || pensando) return;
    agregar({ rol: 'usuario', texto });
    const meta = respuestaMeta(texto);
    if (meta) {
      agregar({ rol: 'asistente', texto: meta, tono: 'normal' });
      return;
    }
    setPensando(true);
    try {
      const hibrido = await reportsApi.preguntarHibrido(texto);
      const abierto = abrir(mapHibridoAReporte(hibrido), tituloDesdeTexto(texto), texto);
      agregar({ rol: 'asistente', texto: textoReporteListo(hibrido.narrativa), tono: 'normal', reporteId: abierto.id, pregunta: texto });
      const formato = formatoPedido(texto);
      if (formato && abierto.reporte.filas.length > 0) alPedirArchivo?.(abierto, formato);
    } catch (e) {
      const fallo = describirFallo(e instanceof ApiError ? e.status : null, e instanceof Error ? e.message : undefined);
      agregar({ rol: 'asistente', ...fallo, pregunta: texto });
    } finally {
      setPensando(false);
    }
  }

  function cerrar(id: string) {
    setAbiertos((prev) => prev.filter((r) => r.id !== id));
    setActivoId((actual) => (actual === id ? null : actual));
  }

  function reemplazar(id: string, reporte: Reporte) {
    // Al reagrupar un reporte del constructor, el título sigue a la nueva agrupación.
    setAbiertos((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, reporte, generadoEn: new Date(), titulo: r.pregunta ? r.titulo : tituloConstructor(reporte.ficha.metrica, reporte.ficha.agruparPor) }
          : r
      )
    );
  }

  const activo = abiertos.find((r) => r.id === activoId) ?? abiertos.at(-1) ?? null;

  return { mensajes, abiertos, activo, setActivoId, pensando, preguntar, abrir, cerrar, reemplazar };
}
