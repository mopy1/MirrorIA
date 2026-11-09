import React from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Aviso } from '@/src/features/saas/components/Aviso';
import type { ResultadoVenta } from '../lib/metodos-pago';
import type { Pasarela } from '../hooks/usePagoPasarela';

interface Props {
  pasarela: Pasarela;
  resultado: ResultadoVenta | null;
  revisando: boolean;
  onRevisar: () => void;
  onOtroMedio: () => void;
}

/** Mientras la clienta paga en Stripe o PayPal: volver y revisar, o elegir otro medio. */
export function EsperandoPasarela({ pasarela, resultado, revisando, onRevisar, onOtroMedio }: Props) {
  const nombre = pasarela === 'PAYPAL' ? 'PayPal' : 'Stripe';
  return (
    <View className="gap-3 rounded-2xl border border-border bg-card p-4">
      <Text className="text-base font-semibold text-foreground">Pagando con {nombre}</Text>
      <Text className="text-sm text-muted-foreground">
        Abrimos la página segura de {nombre}. Cuando termines, volvé a la app: revisamos el pago con {nombre} antes de darlo por hecho.
      </Text>
      {resultado === 'pendiente' && (
        <Aviso tono="info" texto="Todavía no vemos tu pago confirmado. Si ya pagaste, puede tardar unos segundos: revisá de nuevo." />
      )}
      {resultado === 'inactiva' && <Aviso tono="error" texto="Esta compra ya no está activa (venció o se canceló)." />}
      <Button onPress={onRevisar} disabled={revisando}>
        <Text>{revisando ? 'Revisando…' : 'Ya pagué, revisar'}</Text>
      </Button>
      <Button variant="outline" onPress={onOtroMedio} disabled={revisando}>
        <Text>Elegir otro medio</Text>
      </Button>
    </View>
  );
}
