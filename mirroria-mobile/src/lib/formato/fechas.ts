/** "recién", "hace 5 min", "hace 3 h", "hace 2 días". */
export function haceCuanto(ms: number, ahora = Date.now()): string {
  const s = Math.max(0, Math.round((ahora - ms) / 1000));
  if (s < 60) return 'recién';
  const m = Math.round(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'hace 1 día' : `hace ${d} días`;
}

const LA_PAZ_MS = -4 * 60 * 60 * 1000; // UTC−4 todo el año (sin horario de verano)
const dos = (n: number) => String(n).padStart(2, '0');

/** "14:32" en hora de La Paz. */
export function horaLaPaz(ms: number): string {
  const d = new Date(ms + LA_PAZ_MS);
  return `${dos(d.getUTCHours())}:${dos(d.getUTCMinutes())}`;
}

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

/** "sáb 7 · 14:32" en hora de La Paz. */
export function diaHoraLaPaz(ms: number): string {
  const d = new Date(ms + LA_PAZ_MS);
  return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} · ${horaLaPaz(ms)}`;
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Partes de una fecha en La Paz para bloques de calendario: { dia: 'sáb', num: 8, mes: 'nov' }. */
export function partesFechaLaPaz(ms: number): { dia: string; num: number; mes: string } {
  const d = new Date(ms + LA_PAZ_MS);
  return { dia: DIAS[d.getUTCDay()], num: d.getUTCDate(), mes: MESES[d.getUTCMonth()] };
}

/** "sáb 8 nov · 15:00" en hora de La Paz. */
export function fechaCortaLaPaz(ms: number): string {
  const p = partesFechaLaPaz(ms);
  return `${p.dia} ${p.num} ${p.mes} · ${horaLaPaz(ms)}`;
}
