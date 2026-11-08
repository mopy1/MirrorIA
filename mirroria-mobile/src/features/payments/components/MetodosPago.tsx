import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Banknote, CreditCard, QrCode, Wallet, type LucideIcon } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { MetodoCheckout, OpcionPago } from '../lib/metodos-pago';

const ICONO: Record<MetodoCheckout, LucideIcon> = { TARJETA: CreditCard, PAYPAL: Wallet, QR: QrCode, EFECTIVO: Banknote };

interface Props {
  opciones: OpcionPago[];
  procesando: MetodoCheckout | null;
  onElegir: (m: MetodoCheckout) => void;
}

/** Medios de pago de la compra como filas grandes: Stripe, PayPal, QR y efectivo. */
export function MetodosPago({ opciones, procesando, onElegir }: Props) {
  return (
    <View className="overflow-hidden rounded-2xl border border-border">
      {opciones.map((o, i) => {
        const activa = o.disponible && !procesando;
        return (
          <Pressable
            key={o.metodo}
            disabled={!activa}
            onPress={() => onElegir(o.metodo)}
            accessibilityLabel={`Pagar con ${o.titulo}`}
            className={cn('flex-row items-center gap-3 bg-card p-4 active:bg-muted/50', i > 0 && 'border-t border-border', !o.disponible && 'opacity-50')}
          >
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <Icon as={ICONO[o.metodo]} size={20} className="text-foreground" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground">{o.titulo}</Text>
              <Text className="text-xs text-muted-foreground">{o.disponible ? o.detalle : 'No disponible en esta tienda por ahora.'}</Text>
            </View>
            {procesando === o.metodo ? <ActivityIndicator size="small" /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}
