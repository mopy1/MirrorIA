export type PermisoCamara = 'desconocido' | 'concedido' | 'negado' | 'negado-siempre';
export type EstadoCamara = 'apagada' | 'abriendo' | 'lista' | 'error';
export type EstadoSesion = 'inactiva' | 'conectando' | 'en-vivo' | 'error';

export type FaseProbador =
  | 'sin-red'
  | 'inicio'
  | 'tiempo-cumplido'
  | 'permiso'
  | 'permiso-negado'
  | 'abriendo-camara'
  | 'conectando'
  | 'en-vivo'
  | 'error';

export interface EntradaFase {
  online: boolean;
  /** La clienta encendió el probador y la pantalla está enfocada. */
  activo: boolean;
  /** Por qué está apagado: nunca se encendió o se cumplió el tiempo de la sesión. */
  motivoPausa: 'inicio' | 'tiempo';
  permiso: PermisoCamara;
  camara: EstadoCamara;
  sesion: EstadoSesion;
}

/** Una sola fase visible a la vez; el orden de los `if` es la prioridad de los mensajes. */
export function faseProbador(e: EntradaFase): FaseProbador {
  if (!e.online) return 'sin-red';
  if (!e.activo) return e.motivoPausa === 'tiempo' ? 'tiempo-cumplido' : 'inicio';
  if (e.permiso === 'negado' || e.permiso === 'negado-siempre') return 'permiso-negado';
  if (e.permiso === 'desconocido') return 'permiso';
  if (e.camara === 'error' || e.sesion === 'error') return 'error';
  if (e.camara !== 'lista') return 'abriendo-camara';
  return e.sesion === 'en-vivo' ? 'en-vivo' : 'conectando';
}

/** Sesiones cortas: Decart cobra por segundo de video generado. */
export const SEGUNDOS_POR_SESION = 60;

export function formatoCuenta(segundos: number): string {
  const s = Math.max(0, Math.ceil(segundos));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
