/**
 * Horarios ofrecidos para reservar (reglas del backend, `GET /reservas/mias/cupo`):
 * desde ahora + `anticipacionMin` hasta ahora + `ventanaHoras`, cada 30 min, de 10:00 a 20:00 (La Paz, UTC−4).
 */
export interface Horario {
  /** "2026-11-08T15:30:00-04:00" (lo que viaja en `fechaHoraPrevista`). */
  iso: string;
  ms: number;
  dia: string;
  hora: string;
}

const LA_PAZ_MS = -4 * 60 * 60 * 1000;
const PASO_MS = 30 * 60 * 1000;
const dos = (n: number) => String(n).padStart(2, '0');

export function horariosReserva(ahora: number, anticipacionMin = 30, ventanaHoras = 48, apertura = 10, cierre = 20): Horario[] {
  const desde = Math.ceil((ahora + anticipacionMin * 60_000) / PASO_MS) * PASO_MS;
  const hasta = ahora + ventanaHoras * 3_600_000;
  const diaDe = (ms: number) => Math.floor((ms + LA_PAZ_MS) / 86_400_000);
  const salida: Horario[] = [];
  for (let ms = desde; ms <= hasta; ms += PASO_MS) {
    const d = new Date(ms + LA_PAZ_MS);
    const h = d.getUTCHours();
    if (h < apertura || h >= cierre) continue;
    const fecha = `${d.getUTCFullYear()}-${dos(d.getUTCMonth() + 1)}-${dos(d.getUTCDate())}`;
    const hora = `${dos(h)}:${dos(d.getUTCMinutes())}`;
    const offset = diaDe(ms) - diaDe(ahora);
    const dia = offset === 0 ? 'Hoy' : offset === 1 ? 'Mañana' : 'Pasado mañana';
    salida.push({ iso: `${fecha}T${hora}:00-04:00`, ms, dia, hora });
  }
  return salida;
}
