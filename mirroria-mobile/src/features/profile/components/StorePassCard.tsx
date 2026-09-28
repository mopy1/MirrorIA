import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { QrCode, Store, Calendar, CheckCircle2, Clock } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { reservasApi } from '@/src/features/reservas/api/reservasApi';
import { sucursalesApi } from '@/src/features/sucursales/api/sucursalesApi';
import type { ReservaResponseDto } from '@/src/features/reservas/types/reservas.types';

const ESTADOS_ACTIVOS = ['PENDIENTE', 'CONFIRMADA', 'EN_TIENDA'];

const ESTADO_LABEL: Record<string, { label: string; icon: typeof CheckCircle2 }> = {
  PENDIENTE: { label: 'Pendiente de confirmar', icon: Clock },
  CONFIRMADA: { label: 'Confirmada', icon: CheckCircle2 },
  EN_TIENDA: { label: 'En tienda', icon: CheckCircle2 },
};

function formatFechaHora(iso: string): string {
  return new Date(iso).toLocaleString('es-BO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function StorePassCard() {
  const [reserva, setReserva] = useState<ReservaResponseDto | null | undefined>(undefined);
  const [sucursalNombre, setSucursalNombre] = useState<string>('');

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      reservasApi
        .misReservas()
        .then(async (reservas) => {
          const activa =
            reservas.find((r) => ESTADOS_ACTIVOS.includes(r.estado)) ?? null;
          if (cancelled) return;
          setReserva(activa);
          if (activa) {
            const sucursales = await sucursalesApi.getSucursales().catch(() => []);
            const s = sucursales.find((s) => s.id === activa.sucursalId);
            if (!cancelled) setSucursalNombre(s?.nombre ?? 'Sucursal');
          }
        })
        .catch(() => !cancelled && setReserva(null));
      return () => {
        cancelled = true;
      };
    }, []),
  );

  if (reserva === undefined) return null;

  if (reserva === null) {
    return (
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
    );
  }

  const estadoInfo = ESTADO_LABEL[reserva.estado] ?? {
    label: reserva.estado,
    icon: Clock,
  };

  return (
    <View className="rounded-3xl bg-card border border-border/80 p-5 shadow-sm gap-4 relative overflow-hidden">
      <View className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Icon as={Store} size={18} className="text-primary" />
          <Text className="text-sm font-bold text-foreground">Pase de Tienda</Text>
        </View>

        <Badge
          variant={reserva.estado === 'PENDIENTE' ? 'secondary' : 'success'}
          className="px-2 py-0.5 flex-row items-center gap-1"
        >
          <Icon as={estadoInfo.icon} size={11} />
          <Text className="text-[10px] font-bold">{estadoInfo.label}</Text>
        </Badge>
      </View>

      <View className="flex-row items-center gap-4 bg-muted/30 p-3.5 rounded-2xl">
        <View className="w-16 h-16 rounded-xl bg-background border border-border items-center justify-center shadow-xs">
          <Icon as={QrCode} size={36} className="text-foreground" />
        </View>

        <View className="flex-1 gap-1">
          <Text className="text-xs font-bold text-foreground">{sucursalNombre}</Text>
          <View className="flex-row items-center gap-1">
            <Icon as={Calendar} size={12} className="text-muted-foreground" />
            <Text className="text-[11px] text-muted-foreground">
              {formatFechaHora(reserva.fechaHoraPrevista)}
            </Text>
          </View>
          <Text className="text-[10px] text-primary font-semibold">
            Código: {reserva.id.slice(0, 8).toUpperCase()}
          </Text>
        </View>
      </View>

      <Text className="text-[10px] text-muted-foreground text-center">
        Presentá este código en el mostrador para ingresar directo a tu probador sin hacer fila.
      </Text>
    </View>
  );
}
