import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
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
import { CobroQrView } from '../components/CobroQrView';
import type {
  EstadoCobroQrResponseDto,
  InstruccionesResponseDto,
} from '../types/payments.types';

type Vista = 'metodo' | 'instrucciones' | 'qr' | 'exito';

export function PaymentScreen() {
  const { ventaId } = useLocalSearchParams<{ ventaId: string }>();
  const router = useRouter();

  const [venta, setVenta] = useState<VentaResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [vista, setVista] = useState<Vista>('metodo');
  const [instrucciones, setInstrucciones] = useState<InstruccionesResponseDto | null>(null);
  const [pagoQr, setPagoQr] = useState<EstadoCobroQrResponseDto | null>(null);

  // El banco avisó: la venta ya está PAGADA en el backend, solo falta mostrarlo.
  const onQrPagado = useCallback((estado: EstadoCobroQrResponseDto) => {
    setPagoQr(estado);
    setVista('exito');
  }, []);

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

  async function handleManual(metodo: 'EFECTIVO') {
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
            <Text className="text-sm font-bold text-foreground">
              {pagoQr ? 'Pago recibido' : '¡Pago confirmado!'}
            </Text>
            {pagoQr?.transaccion && (
              <Text selectable className="text-xs text-muted-foreground">
                Transacción {pagoQr.transaccion}
              </Text>
            )}
          </View>
        )}

        {vista === 'qr' && (
          <View className="gap-2.5">
            <CobroQrView ventaId={ventaId} onPagado={onQrPagado} />
            <Button variant="outline" onPress={() => setVista('metodo')}>
              <Text>Elegir otro método</Text>
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
              onPress={() => {
                setError(null);
                setVista('qr');
              }}
            >
              <Icon as={QrCode} size={16} className="text-foreground" />
              <Text>Pagar con QR</Text>
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
            <Text className="text-xs text-center text-muted-foreground">
              {instrucciones.instrucciones}
            </Text>
            {/* El UUID completo es ilegible para dictárselo al cajero: se
                destacan los primeros 8 caracteres y el resto queda chico. */}
            <View className="items-center gap-0.5">
              <Text className="text-[11px] text-muted-foreground">Tu pedido</Text>
              <Text selectable className="text-2xl font-bold tracking-widest text-foreground">
                #{instrucciones.referencia.slice(0, 8).toUpperCase()}
              </Text>
              <Text selectable className="text-[10px] text-muted-foreground">
                {instrucciones.referencia}
              </Text>
            </View>
            <Text className="text-[11px] text-muted-foreground text-center">
              Mostrale este número al cajero en la sucursal para confirmar tu pago.
              También lo vas a encontrar en Mis pedidos.
            </Text>
          </View>
        )}

        {vista !== 'metodo' && (
          <View className="gap-2.5">
            <Button onPress={() => router.replace('/pedidos')}>
              <Text>Ver mis pedidos</Text>
            </Button>
            <Button variant="outline" onPress={() => router.replace('/(tabs)/catalogo')}>
              <Text>Seguir comprando</Text>
            </Button>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
