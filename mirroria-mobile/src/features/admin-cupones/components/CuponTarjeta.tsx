import React from 'react';
import { View } from 'react-native';
import { CalendarDays, Tag } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatMoney } from '@/src/lib/money';
import { cn } from '@/lib/utils';
import { ETIQUETA_ESTADO, estadoCupon, formatFecha, textoDescuento, textoUsos, type EstadoCupon } from '../lib/cupones';
import type { Cupon } from '../types/cupones.types';

const COLOR_ESTADO: Record<EstadoCupon, { caja: string; texto: string }> = {
  ACTIVO: { caja: 'bg-emerald-500/10 border-emerald-500/25', texto: 'text-emerald-700 dark:text-emerald-400' },
  AGOTADO: { caja: 'bg-amber-500/10 border-amber-500/25', texto: 'text-amber-700 dark:text-amber-400' },
  EXPIRADO: { caja: 'bg-destructive/10 border-destructive/25', texto: 'text-destructive' },
  INACTIVO: { caja: 'bg-muted border-border', texto: 'text-muted-foreground' },
};

interface Props {
  cupon: Cupon;
  cambiando: boolean;
  onAlternar: () => void;
}

/** Una fila de la tabla de cupones de la web, hecha tarjeta. */
export function CuponTarjeta({ cupon, cambiando, onAlternar }: Props) {
  const estado = estadoCupon(cupon);
  const color = COLOR_ESTADO[estado];
  return (
    <View className="gap-3 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-center gap-3">
        <View className="size-9 items-center justify-center rounded-lg bg-primary/10">
          <Icon as={Tag} size={16} className="text-primary" />
        </View>
        <Text className="flex-1 font-mono text-base font-semibold tracking-wider" numberOfLines={1}>
          {cupon.codigo}
        </Text>
        <View className={cn('rounded-full border px-2.5 py-0.5', color.caja)}>
          <Text className={cn('text-xs font-medium', color.texto)}>{ETIQUETA_ESTADO[estado]}</Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-x-5 gap-y-2">
        <Dato titulo="Descuento" valor={textoDescuento(cupon)} fuerte />
        <Dato titulo="Usos / límite" valor={textoUsos(cupon)} />
        <Dato
          titulo="Compra mínima"
          valor={cupon.montoMinimoCents ? `Mín. ${formatMoney(cupon.montoMinimoCents)}` : 'Sin mínimo'}
        />
      </View>

      <View className="flex-row items-center gap-2">
        <Icon as={CalendarDays} size={14} className="text-muted-foreground" />
        <Text className="flex-1 text-xs text-muted-foreground">
          Del {formatFecha(cupon.fechaInicio)} al {formatFecha(cupon.fechaFin)}
        </Text>
      </View>

      <Button variant={cupon.activo ? 'outline' : 'default'} disabled={cambiando} onPress={onAlternar}>
        <Text>{cambiando ? 'Guardando…' : cupon.activo ? 'Desactivar' : 'Activar'}</Text>
      </Button>
    </View>
  );
}

function Dato({ titulo, valor, fuerte }: { titulo: string; valor: string; fuerte?: boolean }) {
  return (
    <View className="gap-0.5">
      <Text className="text-[11px] uppercase tracking-wide text-muted-foreground">{titulo}</Text>
      <Text className={cn('text-sm', fuerte ? 'font-semibold text-primary' : 'text-foreground')}>{valor}</Text>
    </View>
  );
}
