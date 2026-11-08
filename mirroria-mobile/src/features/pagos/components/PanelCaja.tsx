import { Storefront } from 'phosphor-react-native';
import { View } from 'react-native';
import { MonedaBs } from '@/components/common/MonedaBs';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { codigoCorto } from '@/lib/outbox/consultas';
import type { InstruccionesDto } from '../api/pagos.api';
import { EsperandoPago } from './EsperandoPago';

// El backend manda el id completo de la venta; la cajera ve `#` + sus 8 primeros en `/admin/cobros`.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-/i;
const codigoParaCaja = (ref: string) => (UUID.test(ref) ? codigoCorto(ref) : ref);

/**
 * "Pagar en caja" (sin POS): la app solo muestra el código; la cajera lo busca en la web
 * (`/admin/cobros`) y confirma el efectivo. La pantalla cambia sola cuando lo hace.
 */
export function PanelCaja({ caja, sucursal, online }: { caja: InstruccionesDto; sucursal?: string; online: boolean }) {
  return (
    <View className="gap-4 rounded-lg border border-border bg-card p-5">
      <View className="items-center rounded-lg bg-primary/5 px-4 py-5">
        <Text className="text-xs uppercase tracking-wider text-muted-foreground">Decile este código a la cajera</Text>
        <Text className="mt-1 font-mono text-[40px] leading-[48px] tracking-widest text-foreground" selectable adjustsFontSizeToFit numberOfLines={1}>
          {codigoParaCaja(caja.referencia)}
        </Text>
        <MonedaBs cents={caja.montoCents} className="text-lg text-muted-foreground" />
      </View>
      <View className="flex-row gap-3">
        <Icon as={Storefront} size={20} weight="duotone" className="text-primary" />
        <Text className="flex-1 text-sm leading-5">
          {sucursal ? `En ${sucursal}: ` : ''}
          {caja.instrucciones}
        </Text>
      </View>
      <EsperandoPago texto={online ? 'Esperando que la cajera confirme tu pago…' : 'Sin conexión: el estado se actualiza cuando vuelva la red.'} />
    </View>
  );
}
