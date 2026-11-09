import { Image } from 'expo-image';
import { Warning } from 'phosphor-react-native';
import { View } from 'react-native';
import { MonedaBs } from '@/components/common/MonedaBs';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { EstadoCobroQr } from '@/lib/pagos/estado-pago';
import type { CobroQrDto } from '../api/pagos.api';
import { EsperandoPago } from './EsperandoPago';

/** QR Wayra en pantalla: siempre sobre blanco (contraste del lector), monto y referencia de la glosa. */
export function PanelQr({ qr, estado, online }: { qr: CobroQrDto; estado: EstadoCobroQr | null; online: boolean }) {
  const vencido = estado === 'VENCIDO';
  return (
    <View className="items-center gap-4 rounded-lg border border-border bg-card p-5">
      <View className="rounded-lg bg-white p-3" style={{ opacity: vencido ? 0.25 : 1 }}>
        <Image source={{ uri: qr.qrImagen }} style={{ width: 216, height: 216 }} contentFit="contain" accessibilityLabel="Código QR de pago" />
      </View>
      <View className="items-center">
        <Text className="text-xs text-muted-foreground">Pagás a {qr.comercio}</Text>
        <MonedaBs cents={qr.montoCents} className="text-2xl" />
        <Text className="mt-1 font-mono text-xs text-muted-foreground" selectable>
          Glosa {qr.referencia}
        </Text>
      </View>
      {vencido ? (
        <View className="flex-row items-center gap-2 rounded-full bg-warning/15 px-4 py-2">
          <Icon as={Warning} size={16} weight="bold" className="text-warning" />
          <Text className="text-xs text-warning">Este QR venció. Generá otro para pagar.</Text>
        </View>
      ) : (
        <EsperandoPago texto={online ? 'Esperando el pago… la pantalla cambia sola cuando el banco avise.' : 'Sin conexión: cuando vuelva la red revisamos si pagaste.'} />
      )}
      <Text className="text-center text-xs leading-4 text-muted-foreground">Abrí la app de tu banco, elegí “Pagar con QR” y escaneá este código.</Text>
    </View>
  );
}
