import React from 'react';
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Seccion } from '@/components/admin/Seccion';
import { Text } from '@/components/ui/text';
import { useMarcarLlegada } from '../../hooks/useMarcarLlegada';
import type { ReservaHoyItemDto } from '../../types/dashboard.types';
import { CitaFila } from './CitaFila';

/** Agenda del día con atención en 1 toque ("Ya llegó") y reconfirmación por WhatsApp. */
export function AgendaCitas({ citas, onActualizado }: { citas: ReservaHoyItemDto[]; onActualizado: () => void }) {
  const router = useRouter();
  const { marcarLlegada, actualizandoId, error } = useMarcarLlegada(onActualizado);
  const ahora = new Date();

  return (
    <Seccion
      titulo="Citas de hoy"
      accion={
        <Pressable onPress={() => router.push('/admin/reservas')} hitSlop={8}>
          <Text className="text-sm font-semibold text-primary">Ver todas</Text>
        </Pressable>
      }>
      {citas.length === 0 ? (
        <Text className="text-sm text-muted-foreground">
          No hay citas para hoy. Cuando una clienta reserve prendas para probárselas, va a aparecer
          aquí con su hora.
        </Text>
      ) : (
        <>
          <Text className="text-xs text-muted-foreground">
            {citas.length} {citas.length === 1 ? 'cita' : 'citas'} en el día. «¿Vendrá?» es nuestra
            estimación según su historial: si puede faltar, conviene escribirle antes.
          </Text>
          {citas.map((c) => (
            <CitaFila
              key={c.reservaId}
              cita={c}
              ahora={ahora}
              marcando={actualizandoId === c.reservaId}
              error={error?.id === c.reservaId ? error.mensaje : undefined}
              onMarcarLlegada={marcarLlegada}
            />
          ))}
        </>
      )}
    </Seccion>
  );
}
