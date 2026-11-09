import { useSyncExternalStore } from 'react';
import { NetInfoListener, type EstadoRed } from './net-info-listener';

/** Estado de red reactivo (NetInfoListener + modo demo "Sin red"). */
export function useEstadoRed(): EstadoRed {
  return useSyncExternalStore(NetInfoListener.suscribir, NetInfoListener.obtener);
}
