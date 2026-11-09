import React, { useEffect } from 'react';
import { ActivityIndicator, Image, View } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatMoney } from '@/src/lib/money';
import { Aviso } from '../../saas/components/Aviso';
import { HojaInferior } from '../../saas/components/HojaInferior';
import { useEstadoCobroQr } from '../hooks/useEstadoCobroQr';
import type { CobroSuscripcionResponseDto } from '../types/suscripcion.types';
import { BancoWayra } from './BancoWayra';

interface Props {
  cobro: CobroSuscripcionResponseDto | null;
  onCerrar: () => void;
  onPagado: () => void;
}

/** QR Simple de la suscripción: espera el aviso del banco (sondeo) y se cierra sola al acreditarse. */
export function CobroQrHoja({ cobro, onCerrar, onPagado }: Props) {
  const { pagado, simular, simulando, error } = useEstadoCobroQr(cobro?.cobroId ?? null, () => undefined);

  useEffect(() => {
    if (!pagado) return;
    const t = setTimeout(onPagado, 1500);
    return () => clearTimeout(t);
  }, [pagado, onPagado]);

  const src = cobro?.qrBase64?.startsWith('data:') ? cobro.qrBase64 : `data:image/png;base64,${cobro?.qrBase64 ?? ''}`;

  return (
    <HojaInferior
      visible={!!cobro}
      onCerrar={onCerrar}
      titulo="Pagar con QR Simple"
      descripcion="Interoperable con cualquier banco del sistema nacional."
      pie={
        <Button variant="outline" className="flex-1" onPress={onCerrar} disabled={pagado}>
          <Text>{pagado ? 'Cerrando…' : 'Cancelar'}</Text>
        </Button>
      }
    >
      {cobro && pagado && (
        <View className="items-center gap-2 py-6">
          <Icon as={CheckCircle2} size={48} className="text-emerald-600" />
          <Text className="text-lg font-semibold text-foreground">¡Pago acreditado con éxito!</Text>
          <Text className="text-center text-sm text-muted-foreground">Tu suscripción fue renovada.</Text>
        </View>
      )}
      {cobro && !pagado && (
        <>
          <View className="items-center rounded-xl bg-muted/50 p-3">
            <Text className="text-[11px] uppercase tracking-wide text-muted-foreground">Importe a pagar</Text>
            <Text className="text-2xl font-bold text-foreground">{formatMoney(cobro.montoCents)}</Text>
          </View>
          {cobro.qrBase64 ? (
            <View className="items-center">
              <View className="rounded-xl border border-border bg-white p-2">
                <Image source={{ uri: src }} style={{ width: 200, height: 200 }} resizeMode="contain" accessibilityLabel="Código QR de cobro de la suscripción" />
              </View>
            </View>
          ) : null}
          <View className="flex-row items-center justify-center gap-2">
            <ActivityIndicator size="small" />
            <Text className="text-xs font-medium text-muted-foreground">Esperando confirmación del banco…</Text>
          </View>
          <Text className="text-center text-xs text-muted-foreground">
            Abrí la app de tu banco, escaneá el QR desde otro celular y confirmá el pago.
          </Text>
          <BancoWayra token={cobro.token} />
          <Button variant="ghost" onPress={simular} disabled={simulando}>
            <Text className="text-xs text-amber-700">{simulando ? 'Simulando…' : 'Simular pago bancario (entorno de pruebas)'}</Text>
          </Button>
          {error && <Aviso tono="error" texto={error} />}
        </>
      )}
    </HojaInferior>
  );
}
