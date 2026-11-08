import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import * as React from 'react';
import { useTienda } from '@/contexts/TiendaContext';
import { buscarPorSku } from '@/lib/db/repos/escaner.repo';
import { estadoEspejo } from '@/lib/db/repos/vitrina.repo';
import { parsearEtiqueta } from '@/lib/vitrina/parsear-etiqueta';

export type EstadoEscaneo =
  | { tipo: 'leyendo' }
  | { tipo: 'no-encontrado'; codigo: string }
  | { tipo: 'invalido'; leido: string };

/**
 * Lee una etiqueta (cámara, código escrito o `?codigo=` del deep link), la busca en el espejo
 * SQLite (sin red también, D10) y abre la ficha con talla y color preseleccionados (`?variante=`).
 * Un candado evita abrir la ficha dos veces por el mismo código mientras la cámara sigue leyendo.
 */
export function useEscaner() {
  const { tienda } = useTienda();
  const [estado, setEstado] = React.useState<EstadoEscaneo>({ tipo: 'leyendo' });
  const ocupado = React.useRef(false);
  const espejo = useQuery({
    queryKey: ['vitrina', 'estado-espejo', tienda?.id],
    enabled: !!tienda,
    networkMode: 'always',
    queryFn: () => estadoEspejo(tienda!.id),
  });

  // Al volver de la ficha se puede escanear otra prenda.
  const leyendo = estado.tipo === 'leyendo';
  useFocusEffect(
    React.useCallback(() => {
      if (leyendo) ocupado.current = false;
    }, [leyendo]),
  );

  const leer = React.useCallback(
    /** `forzar`: un `?codigo=` explícito (deep link) se lee aunque la cámara tenga el candado puesto. */
    async (texto: string, forzar = false) => {
      if ((ocupado.current && !forzar) || !tienda) return;
      ocupado.current = true;
      const sku = parsearEtiqueta(texto);
      if (!sku) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return setEstado({ tipo: 'invalido', leido: texto.slice(0, 60) });
      }
      const r = await buscarPorSku(tienda.id, sku);
      if (!r) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return setEstado({ tipo: 'no-encontrado', codigo: sku });
      }
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push({ pathname: '/vitrina/[productoId]', params: { productoId: r.productoId, variante: r.varianteId } });
    },
    [tienda],
  );

  const otraVez = () => {
    ocupado.current = false;
    setEstado({ tipo: 'leyendo' });
  };

  return { estado, leer, otraVez, espejoVacio: espejo.data?.prendas === 0, ultimoSync: espejo.data?.ultimoSync ?? null };
}
