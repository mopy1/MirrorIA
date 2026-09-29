import React, { useCallback, useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight, Package } from 'lucide-react-native';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/src/hooks/useAuth';
import { Pressable } from 'react-native';
import { formatMoney } from '@/src/lib/money';
import { cartApi } from '@/src/features/cart/api/cartApi';
import type { VentaResponseDto } from '@/src/features/cart/types/cart.types';

const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE: 'Pendiente de pago',
  PAGADA: 'Pagada',
  CANCELADA: 'Cancelada',
};

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function OrdersScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [ventas, setVentas] = useState<VentaResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      setLoading(true);
      cartApi
        .misVentas()
        .then((data) => !cancelled && setVentas(data))
        .catch(() => !cancelled && setVentas([]))
        .finally(() => !cancelled && setLoading(false));
      return () => {
        cancelled = true;
      };
    }, [isAuthenticated]),
  );

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Mis Pedidos" showLogo={false} showBack />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#8a1538" />
        </View>
      ) : ventas.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6 gap-3">
          <Icon as={Package} size={32} className="text-muted-foreground/40" />
          <Text className="text-sm text-muted-foreground text-center">
            {isAuthenticated
              ? 'Todavía no hiciste ninguna compra.'
              : 'Iniciá sesión para ver tus compras.'}
          </Text>
          <Button
            variant={isAuthenticated ? 'outline' : 'default'}
            onPress={() => router.push(isAuthenticated ? '/(tabs)/catalogo' : '/(auth)/login')}
          >
            <Text>{isAuthenticated ? 'Ver catálogo' : 'Iniciar sesión'}</Text>
          </Button>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
          {ventas.map((v) => (
            <Pressable
              key={v.id}
              onPress={() =>
                v.estado === 'PENDIENTE' ? router.push(`/pago/${v.id}`) : undefined
              }
              className="p-4 rounded-2xl bg-card border border-border/70 gap-2"
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-foreground">
                  #{v.numeroComprobante ?? v.id.slice(0, 8).toUpperCase()}
                </Text>
                <Badge variant={v.estado === 'PAGADA' ? 'success' : 'secondary'}>
                  <Text className="text-[10px] font-bold">
                    {ESTADO_LABEL[v.estado] ?? v.estado}
                  </Text>
                </Badge>
              </View>
              <Text className="text-[11px] text-muted-foreground">
                {formatFecha(v.createdAt)} · {v.items.length}{' '}
                {v.items.length === 1 ? 'prenda' : 'prendas'}
              </Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-bold text-primary">
                  {formatMoney(v.totalCents)}
                </Text>
                {v.estado === 'PENDIENTE' && (
                  <View className="flex-row items-center">
                    <Text className="text-xs font-semibold text-primary">Completar pago</Text>
                    <Icon as={ChevronRight} size={14} className="text-primary" />
                  </View>
                )}
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
