import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { contextoHttp } from '@/lib/api/contexto-http';
import { escribirConfig, leerConfig } from '@/lib/db/repos/configuracion.repo';

export interface EstadoRed {
  /** Lo que usa toda la app: hay red real y el modo demo está apagado. */
  online: boolean;
  /** NetInfo dice que no hay red (null de isInternetReachable = desconocido, no offline). */
  sinConexion: boolean;
  /** Interruptor de demo "Sin red" (Mis cosas → Pendientes). */
  modoSinRed: boolean;
}

type Oyente = (e: EstadoRed) => void;

/**
 * Frontera ICONIX `NetInfoListener` (spec §5.1):
 * online = !modoSinRed && isConnected && isInternetReachable !== false.
 * Publica en los hooks (`useEstadoRed`), en `onlineManager` de TanStack Query y en el cliente HTTP.
 */
class NetInfoListenerImpl {
  private estado: EstadoRed = { online: true, sinConexion: false, modoSinRed: false };
  private oyentes = new Set<Oyente>();
  private iniciado = false;

  async iniciar(): Promise<void> {
    if (this.iniciado) return;
    this.iniciado = true;
    this.actualizar({ modoSinRed: (await leerConfig('modo_sin_red')) === '1' });
    NetInfo.addEventListener((s: NetInfoState) => {
      this.actualizar({ sinConexion: s.isConnected === false || s.isInternetReachable === false });
    });
  }

  async ponerModoSinRed(activo: boolean): Promise<void> {
    await escribirConfig('modo_sin_red', activo ? '1' : '0');
    this.actualizar({ modoSinRed: activo });
  }

  obtener = (): EstadoRed => this.estado;

  suscribir = (oyente: Oyente): (() => void) => {
    this.oyentes.add(oyente);
    return () => this.oyentes.delete(oyente);
  };

  private actualizar(parcial: Partial<EstadoRed>): void {
    const base = { ...this.estado, ...parcial };
    const siguiente = { ...base, online: !base.modoSinRed && !base.sinConexion };
    if (siguiente.online === this.estado.online && siguiente.modoSinRed === this.estado.modoSinRed && siguiente.sinConexion === this.estado.sinConexion) return;
    this.estado = siguiente;
    contextoHttp.modoSinRed = siguiente.modoSinRed;
    contextoHttp.sinConexion = siguiente.sinConexion;
    onlineManager.setOnline(siguiente.online);
    this.oyentes.forEach((o) => o(siguiente));
  }
}

export const NetInfoListener = new NetInfoListenerImpl();
