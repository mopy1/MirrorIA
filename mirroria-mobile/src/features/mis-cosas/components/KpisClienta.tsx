import { View } from 'react-native';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import type { CupoReservas } from '@/features/vitrina/api/reservas.api';
import { formatoBs } from '@/lib/formato/dinero';
import type { ResumenClienta } from '@/lib/pagos/resumen-clienta';
import { cn } from '@/lib/utils';

function Kpi({ valor, etiqueta, destacado }: { valor: string; etiqueta: string; destacado?: boolean }) {
  return (
    <View className={cn('min-h-[76px] flex-1 justify-between rounded-lg border p-3', destacado ? 'border-warning/50 bg-warning/10' : 'border-border bg-card')}>
      <Text className="font-mono text-xl leading-7" style={{ fontVariant: ['tabular-nums'] }} numberOfLines={1} adjustsFontSizeToFit>
        {valor}
      </Text>
      <Text className="text-xs leading-4 text-muted-foreground">{etiqueta}</Text>
    </View>
  );
}

/** 4 KPIs en grilla 2×2: compras, por pagar, reservas X de Y (cupo del backend) y ahorro con cupones. */
export function KpisClienta({ r, cupo, cargando }: { r: ResumenClienta; cupo: CupoReservas | null; cargando: boolean }) {
  if (cargando) return <View className="flex-row flex-wrap gap-2 px-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} style={{ height: 76, width: '48.5%' }} />)}</View>;
  return (
    <View className="gap-2 px-5">
      <View className="flex-row gap-2">
        <Kpi valor={String(r.compras)} etiqueta={r.compras === 1 ? 'compra pagada' : 'compras pagadas'} />
        <Kpi valor={String(r.porPagar)} etiqueta="por pagar" destacado={r.porPagar > 0} />
      </View>
      <View className="flex-row gap-2">
        <Kpi valor={cupo ? `${cupo.reservasActivas} de ${cupo.maxReservasActivas}` : String(r.reservasActivas)} etiqueta="reservas activas" />
        <Kpi valor={formatoBs(r.ahorroCents)} etiqueta="ahorraste con cupones" />
      </View>
    </View>
  );
}
