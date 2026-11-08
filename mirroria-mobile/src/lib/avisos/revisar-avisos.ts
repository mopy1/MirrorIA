import * as Notifications from 'expo-notifications';
import { listarAvisos, marcarAvisos } from '@/lib/db/repos/avisos.repo';
import { decidirAvisos } from './decidir-avisos';

/**
 * Se llama tras cada snapshot del espejo (spec §4.3): si una talla con aviso pasó de 0 a > 0,
 * notificación LOCAL inmediata (Expo Go no recibe push remotas). Tocarla abre la ficha con esa
 * variante (`data.ruta`, lo maneja `useAbrirDesdeNotificacion`). Devuelve cuántas se mandaron.
 */
export async function revisarAvisos(tenantId: string): Promise<number> {
  const avisos = await listarAvisos(tenantId);
  const vivos = avisos.filter((a) => a.productoId); // prenda fuera del espejo: no se toca
  const { notificar, rearmar } = decidirAvisos(vivos);
  await marcarAvisos(rearmar, null);
  if (notificar.length === 0) return 0;
  const permiso = await Notifications.getPermissionsAsync();
  for (const a of vivos.filter((x) => notificar.includes(x.id))) {
    if (permiso.granted) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Volvió tu talla ${a.talla}`,
          body: `${a.prenda} · ${a.color}: ya hay en ${a.sucursalConStock ?? 'la tienda'}. Tocá para verla.`,
          data: { ruta: `/vitrina/${a.productoId}?variante=${a.varianteId}` },
        },
        trigger: null,
      });
    }
  }
  // Sin permiso igual se marca: la clienta lo ve como "Volvió" en Mis cosas → Avisos.
  await marcarAvisos(notificar, Date.now());
  return notificar.length;
}
