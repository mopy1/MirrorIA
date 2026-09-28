import React, { useEffect, useState } from 'react';
import { View, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { CreditCard, QrCode, Banknote, CheckCircle2 } from 'lucide-react-native';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { formatMoney } from '@/src/lib/money';
import { ApiError } from '@/src/lib/api';
import { cartApi } from '@/src/features/cart/api/cartApi';
import { pagosApi } from '../api/pagosApi';
import type { VentaResponseDto } from '@/src/features/cart/types/cart.types';
import type { InstruccionesResponseDto } from '../types/payments.types';

type Vista = 'metodo' | 'instrucciones' | 'exito';

export function PaymentScreen() {
  const { ventaId } = useLocalSearchParams<{ ventaId: string }>();
  const router = useRouter();

  const [venta, setVenta] = useState<VentaResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [vista, setVista] = useState<Vista>('metodo');
  const [instrucciones, setInstrucciones] = useState<InstruccionesResponseDto | null>(null);

  useEffect(() => {
    if (!ventaId) return;
    cartApi
      .getVenta(ventaId)
      .then((v) => {
        setVenta(v);
        if (v.estado === 'PAGADA') setVista('exito');
      })
      .catch(() => setVenta(null))
      .finally(() => setLoading(false));
  }, [ventaId]);

  async function pollVentaHastaPagada(intentos = 6) {
    for (let i = 0; i < intentos; i++) {
      await new Promise((r) => setTimeout(r, 1800));
      try {
        const v = await cartApi.getVenta(ventaId);
        setVenta(v);
        if (v.estado === 'PAGADA') {
          setVista('exito');
          return;
        }
      } catch {
        // seguimos intentando
      }
    }
  }

  async function handleTarjeta() {
    setProcesando('TARJETA');
    setError(null);
    try {
      const { url } = await pagosApi.iniciarTarjeta(ventaId);
      await WebBrowser.openBrowserAsync(url);
      // El regreso del navegador no prueba nada por sí solo — el webhook de
      // Stripe es la única autoridad real. Consultamos el estado real de la
      // venta unos segundos después de que la clienta cierra el navegador.
      await pollVentaHastaPagada();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar el pago con tarjeta');
    } finally {
      setProcesando(null);
    }
  }

  async function handleManual(metodo: 'QR' | 'EFECTIVO') {
    setProcesando(metodo);
    setError(null);
    try {
      const data = await pagosApi.iniciarManual(ventaId, metodo);
      setInstrucciones(data);
      setVista('instrucciones');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar el cobro');
    } finally {
      setProcesando(null);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#8a1538" />
      </View>
    );
  }

  if (!venta) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Pago" showLogo={false} showBack />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-sm text-muted-foreground text-center">
            No se pudo cargar esta compra.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Pago" showLogo={false} showBack />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
        <View className="items-center gap-1 py-2">
          <Text className="text-xs text-muted-foreground">Total a pagar</Text>
          <Text className="text-2xl font-bold text-primary">
            {formatMoney(venta.totalCents)}
          </Text>
        </View>

        {error && (
          <Text className="text-xs font-semibold text-destructive text-center">{error}</Text>
        )}

        {vista === 'exito' && (
          <View className="items-center gap-3 py-8">
            <Icon as={CheckCircle2} size={48} className="text-emerald-600" />
            <Text className="text-sm font-bold text-foreground">¡Pago confirmado!</Text>
            <Button size="sm" onPress={() => router.replace('/(tabs)')}>
              <Text>Volver al inicio</Text>
            </Button>
          </View>
        )}

        {vista === 'metodo' && (
          <View className="gap-3">
            <Button disabled={procesando !== null} onPress={handleTarjeta}>
              <Icon as={CreditCard} size={16} className="text-primary-foreground" />
              <Text>{procesando === 'TARJETA' ? 'Abriendo…' : 'Pagar con tarjeta'}</Text>
            </Button>
            <Button
              variant="outline"
              disabled={procesando !== null}
              onPress={() => handleManual('QR')}
            >
              <Icon as={QrCode} size={16} className="text-foreground" />
              <Text>{procesando === 'QR' ? 'Generando…' : 'Pagar con QR'}</Text>
            </Button>
            <Button
              variant="outline"
              disabled={procesando !== null}
              onPress={() => handleManual('EFECTIVO')}
            >
              <Icon as={Banknote} size={16} className="text-foreground" />
              <Text>{procesando === 'EFECTIVO' ? 'Generando…' : 'Pagar en efectivo'}</Text>
            </Button>
            {venta.estado !== 'PENDIENTE' && (
              <Text className="text-[11px] text-muted-foreground text-center">
                Estado actual: {venta.estado}
              </Text>
            )}
          </View>
        )}

        {vista === 'instrucciones' && instrucciones && (
          <View className="items-center gap-4 p-5 rounded-2xl bg-card border border-border/70">
            {instrucciones.qrUrl && (
              <Image
                source={{ uri: instrucciones.qrUrl }}
                className="w-40 h-40 rounded-xl bg-muted/30"
                resizeMode="contain"
              />
            )}
            <Text className="text-xs text-center text-muted-foreground">
              {instrucciones.instrucciones}
            </Text>
            <Text className="text-xs font-bold text-foreground">
              Referencia: {instrucciones.referencia}
            </Text>
            <Text className="text-[11px] text-muted-foreground text-center">
              Mostrale esta referencia al cajero en la sucursal para confirmar tu pago.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
