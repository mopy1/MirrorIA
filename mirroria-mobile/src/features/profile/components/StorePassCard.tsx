import React, { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Store, Ban } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { reservasApi } from '@/src/features/reservas/api/reservasApi';
import { sucursalesApi } from '@/src/features/sucursales/api/sucursalesApi';
import type {
  CupoReserva,
  ReservaResponseDto,
} from '@/src/features/reservas/types/reservas.types';
import { PaseReserva } from './PaseReserva';

const ESTADOS_ACTIVOS = ['PENDIENTE', 'CONFIRMADA', 'EN_TIENDA'];

interface Datos {
  activas: ReservaResponseDto[];
  cupo: CupoReserva | null;
  sucursales: Record<string, string>;
}

/**
 * Pases de las reservas activas (hasta `maxReservasActivas`, hoy 2) y, si la
 * clienta quedó bloqueada por faltas, el motivo y hasta cuándo.
 */
export function StorePassCard() {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [recarga, setRecarga] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      Promise.all([
        reservasApi.misReservas(),
        reservasApi.getCupo().catch(() => null),
        sucursalesApi.getSucursales().catch(() => []),
      ])
        .then(([reservas, cupo, sucursales]) => {
          if (cancelled) return;
          setDatos({
            activas: reservas
              .filter((r) => ESTADOS_ACTIVOS.includes(r.estado))
              .sort((a, b) => a.fechaHoraPrevista.localeCompare(b.fechaHoraPrevista)),
            cupo,
            sucursales: Object.fromEntries(sucursales.map((s) => [s.id, s.nombre])),
          });
        })
        .catch(() => !cancelled && setDatos({ activas: [], cupo: null, sucursales: {} }));
      return () => {
        cancelled = true;
      };
    }, [recarga]),
  );

  const cancelar = (id: string) =>
    Alert.alert('¿Cancelar la reserva?', 'La prenda deja de estar apartada para vos.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: () =>
          reservasApi
            .cancelar(id)
            .then(() => setRecarga((n) => n + 1))
            .catch(() => Alert.alert('No se pudo cancelar', 'Probá de nuevo en un momento.')),
      },
    ]);

  if (!datos) return null;
  const bloqueada = datos.cupo?.bloqueadaHasta ? datos.cupo : null;

  return (
    <View className="gap-3">
      {bloqueada && (
        <View className="rounded-3xl border border-destructive/30 bg-destructive/5 p-4 flex-row gap-3">
          <Icon as={Ban} size={20} className="text-destructive mt-0.5" />
          <Text className="flex-1 text-[11px] text-foreground leading-relaxed">
            {bloqueada.motivo}
          </Text>
        </View>
      )}

      {datos.activas.map((r) => (
        <PaseReserva
          key={r.id}
          reserva={r}
          sucursalNombre={datos.sucursales[r.sucursalId] ?? 'Sucursal'}
          toleranciaMinutos={datos.cupo?.toleranciaMinutos ?? 30}
          onCancelar={() => cancelar(r.id)}
        />
      ))}

      {datos.activas.length === 0 && !bloqueada && (
        <View className="rounded-3xl bg-card border border-border/70 p-5 items-center gap-2">
          <Icon as={Store} size={24} className="text-muted-foreground/50" />
          <Text className="text-xs text-muted-foreground text-center">
            No tenés reservas activas. Elegí una prenda del catálogo y tocá{' '}
            <Text className="text-xs font-semibold text-foreground">
              "Reservar para probar en tienda"
            </Text>
            .
          </Text>
        </View>
      )}
    </View>
  );
}
