import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ShoppingBag } from 'lucide-react-native';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { formatMoney } from '@/src/lib/money';
import { useAuth } from '@/src/hooks/useAuth';
import { ApiError } from '@/src/lib/api';
import { cartApi } from '../api/cartApi';
import {
  indiceVariantes,
  type VarianteConProducto,
} from '@/src/features/catalog/lib/indiceVariantes';
import type { ProductoResponseDto } from '@/src/features/catalog/types/catalog.types';
import type { CarritoItem } from '../types/cart.types';
import { CartItemRow } from '../components/CartItemRow';
import { SucursalPicker } from '../components/SucursalPicker';

interface EnrichedItem {
  item: CarritoItem;
  producto: ProductoResponseDto;
  tallaNombre: string;
  colorNombre: string;
}

export function CartScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<CarritoItem[]>([]);
  const [indice, setIndice] = useState<Map<string, VarianteConProducto>>(new Map());
  const [loading, setLoading] = useState(true);
  const [sucursalId, setSucursalId] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [carrito, idx] = await Promise.all([cartApi.getCarrito(user.id), indiceVariantes()]);
      setItems(carrito.items);
      setIndice(idx);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const enriched: EnrichedItem[] = items
    .map((item) => {
      const encontrada = indice.get(item.varianteId);
      if (!encontrada) return null;
      return {
        item,
        producto: encontrada.producto,
        tallaNombre: encontrada.variante.tallaNombre,
        colorNombre: encontrada.variante.colorNombre,
      };
    })
    .filter((x): x is EnrichedItem => x !== null);

  const totalCents = enriched.reduce(
    (acc, e) => acc + e.producto.precioCents * e.item.cantidad,
    0,
  );

  async function handleRemove(varianteId: string) {
    if (!user) return;
    const carrito = await cartApi.removeItem(user.id, varianteId);
    setItems(carrito.items);
  }

  async function handleCheckout() {
    if (!user || !sucursalId) return;
    setCheckingOut(true);
    setError(null);
    try {
      const venta = await cartApi.checkout(user.id, {
        sucursalId,
        canal: 'MOVIL',
      });
      router.push(`/pago/${venta.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar la compra');
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Mi Carrito" showLogo={false} showBack />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#8a1538" />
        </View>
      ) : enriched.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6 gap-3">
          <Icon as={ShoppingBag} size={32} className="text-muted-foreground/40" />
          <Text className="text-sm text-muted-foreground text-center">
            {user ? 'Tu carrito está vacío.' : 'Iniciá sesión para ver tu carrito.'}
          </Text>
          <Button
            variant={user ? 'outline' : 'default'}
            onPress={() => router.push(user ? '/(tabs)/catalogo' : '/(auth)/login')}
          >
            <Text>{user ? 'Ver catálogo' : 'Iniciar sesión'}</Text>
          </Button>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 200 }}>
          {enriched.map((e) => (
            <CartItemRow
              key={e.item.varianteId}
              producto={e.producto}
              tallaNombre={e.tallaNombre}
              colorNombre={e.colorNombre}
              cantidad={e.item.cantidad}
              onRemove={() => handleRemove(e.item.varianteId)}
            />
          ))}

          <View className="mt-2">
            <SucursalPicker value={sucursalId} onChange={setSucursalId} />
          </View>
        </ScrollView>
      )}

      {enriched.length > 0 && (
        <View className="p-4 border-t border-border/50 bg-background gap-3">
          {error && <Text className="text-xs font-semibold text-destructive">{error}</Text>}
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-muted-foreground">Total</Text>
            <Text className="text-lg font-bold text-primary">{formatMoney(totalCents)}</Text>
          </View>
          <Button disabled={!sucursalId || checkingOut} onPress={handleCheckout}>
            <Text>{checkingOut ? 'Procesando…' : 'Comprar'}</Text>
          </Button>
          {!sucursalId && (
            <Text className="text-[11px] text-center text-muted-foreground">
              Elegí la sucursal donde vas a retirar tu compra.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
