import { View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Titulo } from '@/components/common/Titulo';
import { Text } from '@/components/ui/text';
import { codigoPase } from '@/lib/reservas/comprar-reserva';
import { cn } from '@/lib/utils';
import { BadgeEstadoReserva } from './BadgeEstadoReserva';

/**
 * Pase de Tienda (D11): QR con SOLO el código (para un lector web futuro) + el código grande para
 * dictarlo. Siempre negro sobre blanco, también en tiendas oscuras (los lectores lo necesitan).
 */
export function PaseQr({ reservaId, estado, tienda, activo }: { reservaId: string; estado: string; tienda: string; activo: boolean }) {
  const codigo = codigoPase(reservaId);
  return (
    <View className="overflow-hidden rounded-xl border border-border bg-card">
      <View className="flex-row items-center justify-between bg-primary px-5 py-3">
        <Titulo nivel="h3" className="text-primary-foreground" numberOfLines={1}>
          {tienda}
        </Titulo>
        <Text className="font-body-semibold text-xs uppercase tracking-wider text-primary-foreground/80">Pase de tienda</Text>
      </View>
      <View className="items-center gap-3 px-5 pb-5 pt-6">
        <View className={cn('rounded-lg bg-white p-4', !activo && 'opacity-30')}>
          <QRCode value={codigo} size={184} color="#111111" backgroundColor="#FFFFFF" ecl="M" />
        </View>
        <Text className="font-mono text-[34px] leading-10 tracking-[4px] text-foreground" selectable accessibilityLabel={`Código ${codigo.split('').join(' ')}`}>
          #{codigo}
        </Text>
        <BadgeEstadoReserva estado={estado} className="self-center" />
      </View>
    </View>
  );
}
