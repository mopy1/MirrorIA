import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { CreditCard, Landmark, QrCode, Wallet, type LucideIcon } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { IconoPasarela, PasarelaMetadata } from '@/src/features/payments/types/pasarelas.types';
import type { PasarelaSuscripcion } from '../types/suscripcion.types';

const ICONO: Record<IconoPasarela, LucideIcon> = {
  'credit-card': CreditCard,
  'qr-code': QrCode,
  'paypal-logo': Wallet,
  money: Landmark,
};

interface Props {
  pasarelas: PasarelaMetadata[];
  iniciando: PasarelaSuscripcion | null;
  onElegir: (id: PasarelaSuscripcion) => void;
}

/** "Elegí cómo pagar": QR Wayra, Stripe, PayPal… las que el servidor ofrece para suscripciones. */
export function PasarelasSuscripcion({ pasarelas, iniciando, onElegir }: Props) {
  if (pasarelas.length === 0) {
    return <Text className="text-sm text-muted-foreground">No hay pasarelas de pago disponibles en este momento.</Text>;
  }
  return (
    <View className="overflow-hidden rounded-2xl border border-border">
      {pasarelas.map((p, i) => {
        const operativa = p.estado === 'DISPONIBLE' && !iniciando;
        return (
          <Pressable
            key={p.id}
            disabled={!operativa}
            onPress={() => onElegir(p.id as PasarelaSuscripcion)}
            className={cn('flex-row items-center gap-3 bg-card p-4 active:bg-muted/50', i > 0 && 'border-t border-border', !operativa && 'opacity-60')}
          >
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <Icon as={ICONO[p.icono] ?? CreditCard} size={20} className="text-foreground" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground">{p.nombre}</Text>
              <Text className="text-xs text-muted-foreground">{p.descripcion}</Text>
            </View>
            {iniciando === p.id ? (
              <ActivityIndicator size="small" />
            ) : p.estado !== 'DISPONIBLE' ? (
              <Text className="text-[11px] font-medium text-amber-700">{p.estado === 'EN_DESARROLLO' ? 'En desarrollo' : 'Próximamente'}</Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
