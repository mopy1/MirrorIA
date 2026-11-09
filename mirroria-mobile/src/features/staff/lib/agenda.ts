/** Reservas agrupadas por día (agenda), en orden de hora. Las activas primero si `activas`. */
export const ACTIVAS = ['PENDIENTE', 'CONFIRMADA', 'EN_TIENDA'];

export function filtrarReservas<R extends { estado: string }>(reservas: R[], filtro: string): R[] {
  if (filtro === '') return reservas;
  if (filtro === 'ACTIVAS') return reservas.filter((r) => ACTIVAS.includes(r.estado));
  return reservas.filter((r) => r.estado === filtro);
}

export function agruparPorDia<R extends { fechaHoraPrevista: string }>(reservas: R[]): { dia: string; data: R[] }[] {
  const orden = [...reservas].sort((a, b) => a.fechaHoraPrevista.localeCompare(b.fechaHoraPrevista));
  const grupos = new Map<string, R[]>();
  for (const r of orden) {
    const d = new Date(r.fechaHoraPrevista);
    const clave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    grupos.set(clave, [...(grupos.get(clave) ?? []), r]);
  }
  return [...grupos.entries()].map(([dia, data]) => ({ dia, data }));
}

export function tituloDia(dia: string, hoy = new Date()): string {
  const [a, m, d] = dia.split('-').map(Number);
  const fecha = new Date(a, m - 1, d);
  const base = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const diff = Math.round((fecha.getTime() - base.getTime()) / 86_400_000);
  const texto = fecha.toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' });
  if (diff === 0) return `Hoy · ${texto}`;
  if (diff === 1) return `Mañana · ${texto}`;
  if (diff === -1) return `Ayer · ${texto}`;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
