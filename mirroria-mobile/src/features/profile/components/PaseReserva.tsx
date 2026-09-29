import React from 'react';
import { Pressable, View } from 'react-native';
import { QrCode, Store, Calendar, CheckCircle2, Clock } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import type { ReservaResponseDto } from '@/src/features/reservas/types/reservas.types';

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

interface PaseReservaProps {
  reserva: ReservaResponseDto;
  sucursalNombre: string;
  toleranciaMinutos: number;
  onCancelar: () => void;
}

/** Un pase por reserva activa: sucursal, hora, código para el mostrador. */
export function PaseReserva({
  reserva,
  sucursalNombre,
  toleranciaMinutos,
  onCancelar,
}: PaseReservaProps) {
  const estado = ESTADO_LABEL[reserva.estado] ?? { label: reserva.estado, icon: Clock };

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
          <Icon as={estado.icon} size={11} />
          <Text className="text-[10px] font-bold">{estado.label}</Text>
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
          <Text className="text-[10px] text-muted-foreground mt-0.5">Código para el mostrador</Text>
          {/* Mismo código que ve la web y que el cajero busca en el panel. */}
          <Text selectable className="text-lg font-bold tracking-widest text-primary">
            #{reserva.id.slice(0, 8).toUpperCase()}
          </Text>
        </View>
      </View>

      <Text className="text-[10px] text-muted-foreground text-center">
        Dictale este código al personal en el mostrador. Si no llegás hasta {toleranciaMinutos} min después
        de la hora, la reserva vence sola y cuenta como falta.
      </Text>

      {/* Ya en la tienda la cierra el personal (con la venta o "No compró"). */}
      {reserva.estado !== 'EN_TIENDA' && (
        <Pressable onPress={onCancelar} hitSlop={6} className="self-center">
          <Text className="text-[11px] font-semibold text-destructive">Cancelar reserva</Text>
        </Pressable>
      )}
    </View>
  );
}
