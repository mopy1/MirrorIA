import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, View } from 'react-native';
import { Clock } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { formatMoney } from '@/src/lib/money';
import { ApiError } from '@/src/lib/api';
import { pagosApi } from '../api/pagosApi';
import type { CobroQrResponseDto, EstadoCobroQrResponseDto } from '../types/payments.types';

/** Cada cuánto se pregunta si ya pagaron. */
const INTERVALO_MS = 2500;

interface CobroQrViewProps {
  ventaId: string;
  onPagado: (estado: EstadoCobroQrResponseDto) => void;
}

/**
 * El QR de ESTA compra, con su monto. Se paga escaneándolo desde otro celular
 * con la app del banco; esta pantalla solo espera el aviso y cambia sola.
 */
export function CobroQrView({ ventaId, onPagado }: CobroQrViewProps) {
  const [cobro, setCobro] = useState<CobroQrResponseDto | null>(null);
  const [vencido, setVencido] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    pagosApi
      .iniciarQr(ventaId)
      .then(setCobro)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'No se pudo generar el QR de pago')
      );
  }, [ventaId]);

  useEffect(() => {
    if (!cobro || vencido) return;
    let activo = true;
    const id = setInterval(() => {
      pagosApi
        .estadoQr(cobro.pagoId)
        .then((e) => {
          if (!activo) return;
          if (e.estado === 'PAGADO') onPagado(e);
          if (e.estado === 'VENCIDO') setVencido(true);
        })
        // Un corte de red suelto no tira la pantalla: el próximo intento vuelve a preguntar.
        .catch(() => undefined);
    }, INTERVALO_MS);
    return () => {
      activo = false;
      clearInterval(id);
    };
  }, [cobro, vencido, onPagado]);

  if (error) {
    return <Text className="text-center text-xs font-semibold text-destructive">{error}</Text>;
  }

  if (!cobro) {
    return (
      <View className="items-center py-10">
        <ActivityIndicator color="#8a1538" />
      </View>
    );
  }

  return (
    <View className="items-center gap-4 rounded-2xl border border-border/70 bg-card p-5">
      <View className="items-center gap-0.5">
        <Text className="text-base font-bold text-foreground">Pagá con QR</Text>
        <Text className="text-center text-xs text-muted-foreground">
          Escaneá este código con la app de tu banco desde otro celular.
        </Text>
      </View>

      <View className="rounded-xl bg-white p-2">
        <Image
          source={{ uri: cobro.qrImagen }}
          style={{ width: 220, height: 220, opacity: vencido ? 0.15 : 1 }}
          resizeMode="contain"
          accessibilityLabel={`Código QR para pagar ${formatMoney(cobro.montoCents)} a ${cobro.comercio}`}
        />
      </View>

      <View className="w-full flex-row justify-between">
        <View>
          <Text className="text-[11px] text-muted-foreground">Comercio</Text>
          <Text className="text-sm font-semibold text-foreground">{cobro.comercio}</Text>
        </View>
        <View className="items-end">
          <Text className="text-[11px] text-muted-foreground">Referencia</Text>
          <Text selectable className="text-sm font-semibold text-foreground">
            {cobro.referencia}
          </Text>
        </View>
      </View>

      {vencido ? (
        <View className="flex-row items-center gap-2">
          <Icon as={Clock} size={14} className="text-muted-foreground" />
          <Text className="text-xs text-muted-foreground">
            Esta compra venció sin pagarse y su stock volvió a la tienda.
          </Text>
        </View>
      ) : (
        <View className="flex-row items-center gap-2">
          <ActivityIndicator size="small" color="#8a1538" />
          <Text className="text-sm font-semibold text-foreground">Esperando el pago</Text>
        </View>
      )}
    </View>
  );
}
