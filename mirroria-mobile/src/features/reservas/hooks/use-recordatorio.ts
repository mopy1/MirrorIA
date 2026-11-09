import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { borrarConfig, escribirConfig, leerConfigJson } from '@/lib/db/repos/configuracion.repo';

interface Recordatorio {
  id: string;
  en: number;
}

const CANAL = 'recordatorios';

/**
 * Recordatorio LOCAL 1 h antes de la cita (`expo-notifications`, trigger de fecha; las push remotas
 * no andan en Expo Go). El id queda en `configuracion_sync` para mostrarlo y poder quitarlo.
 */
export function useRecordatorio(reservaId: string | undefined) {
  const qc = useQueryClient();
  const clave = `recordatorio:${reservaId}` as const;
  const actual = useQuery({
    queryKey: ['recordatorio', reservaId],
    enabled: !!reservaId,
    networkMode: 'always',
    queryFn: async () => (await leerConfigJson<Recordatorio>(clave)) ?? null,
  });

  const programar = useMutation({
    networkMode: 'always',
    mutationFn: async (a: { en: number; titulo: string; cuerpo: string }) => {
      const permiso = await Notifications.requestPermissionsAsync();
      if (!permiso.granted) throw new Error('Activá las notificaciones de la app para recibir el recordatorio.');
      // En Expo Go 58 (Android) crear un canal propio tira un NullPointerException nativo:
      // si falla, el recordatorio va al canal por defecto de Expo (igual suena y se muestra).
      const canal = await Notifications.setNotificationChannelAsync(CANAL, { name: 'Recordatorios de reservas', importance: AndroidImportance.HIGH })
        .then(() => CANAL)
        .catch(() => undefined);
      const id = await Notifications.scheduleNotificationAsync({
        content: { title: a.titulo, body: a.cuerpo, data: { ruta: `/mis-cosas/reservas/${reservaId}` } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(a.en), ...(canal ? { channelId: canal } : {}) },
      });
      await escribirConfig(clave, JSON.stringify({ id, en: a.en }));
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['recordatorio', reservaId] }),
  });

  const quitar = useMutation({
    networkMode: 'always',
    mutationFn: async () => {
      if (actual.data) await Notifications.cancelScheduledNotificationAsync(actual.data.id);
      await borrarConfig(clave);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['recordatorio', reservaId] }),
  });

  return { actual: actual.data ?? null, programar, quitar };
}
