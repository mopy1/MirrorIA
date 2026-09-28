import React, { useEffect, useState } from 'react';
import { View, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarClock, ShoppingBag } from 'lucide-react-native';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { formatMoney } from '@/src/lib/money';
import { getPrimaryImageUrl } from '@/src/lib/images';
import { useAuth } from '@/src/hooks/useAuth';
import { ApiError } from '@/src/lib/api';
import { catalogApi } from '../api/catalogApi';
import { cartApi } from '@/src/features/cart/api/cartApi';
import { reservasApi } from '@/src/features/reservas/api/reservasApi';
import { VarianteSelector } from '../components/VarianteSelector';
import { ReservarEnTiendaSheet } from '../components/ReservarEnTiendaSheet';
import type { ProductoResponseDto } from '../types/catalog.types';

export function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [product, setProduct] = useState<ProductoResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [varianteId, setVarianteId] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showReservar, setShowReservar] = useState(false);
  const [reservando, setReservando] = useState(false);

  useEffect(() => {
    if (!id) return;
    catalogApi
      .getProducto(id)
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const image = product ? getPrimaryImageUrl(product.imagenes) ?? product.imagenes?.[0]?.url : null;

  async function handleAgregarAlCarrito() {
    if (!user || !varianteId) return;
    setAddingToCart(true);
    setFeedback(null);
    try {
      await cartApi.addItem(user.id, varianteId, 1);
      setFeedback('Agregado al carrito ✓');
    } catch (err) {
      setFeedback(err instanceof ApiError ? err.message : 'No se pudo agregar al carrito');
    } finally {
      setAddingToCart(false);
    }
  }

  async function handleReservar(sucursalId: string, fechaHoraPrevista: string) {
    if (!varianteId) return;
    setReservando(true);
    setFeedback(null);
    try {
      await reservasApi.create({
        sucursalId,
        fechaHoraPrevista,
        items: [{ varianteId, cantidad: 1 }],
      });
      setFeedback('Reserva confirmada — la vas a ver en tu perfil ✓');
      setShowReservar(false);
    } catch (err) {
      setFeedback(err instanceof ApiError ? err.message : 'No se pudo reservar');
    } finally {
      setReservando(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#8a1538" />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Producto" showLogo={false} showBack />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-sm text-muted-foreground text-center">
            No se pudo cargar este producto.
          </Text>
        </View>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title={product.titulo} showLogo={false} showBack />
        <View className="flex-1 items-center justify-center px-6 gap-3">
          <Text className="text-sm text-muted-foreground text-center">
            Iniciá sesión para comprar o reservar esta prenda.
          </Text>
          <Button size="sm" onPress={() => router.push('/(auth)/login')}>
            <Text>Iniciar sesión</Text>
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={product.titulo} showLogo={false} showBack />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ aspectRatio: 4 / 5 }} className="w-full bg-muted/30">
          {image && (
            <Image source={{ uri: image }} className="w-full h-full" resizeMode="cover" />
          )}
        </View>

        <View className="p-4 gap-5">
          <View className="gap-1">
            <Text className="text-lg font-bold text-foreground">{product.titulo}</Text>
            <Text className="text-xl font-bold text-primary">
              {formatMoney(product.precioCents)}
            </Text>
            {product.descripcion && (
              <Text className="text-xs text-muted-foreground mt-1">
                {product.descripcion}
              </Text>
            )}
          </View>

          <View className="gap-2">
            <Text className="text-xs font-bold text-foreground">Talla y color</Text>
            <VarianteSelector
              variantes={product.variantes ?? []}
              selectedId={varianteId}
              onSelect={setVarianteId}
            />
          </View>

          {feedback && (
            <Text className="text-xs font-semibold text-primary">{feedback}</Text>
          )}

          <View className="gap-2.5">
            <Button
              disabled={!varianteId || addingToCart}
              onPress={handleAgregarAlCarrito}
            >
              <Icon as={ShoppingBag} size={16} className="text-primary-foreground" />
              <Text>{addingToCart ? 'Agregando…' : 'Agregar al carrito'}</Text>
            </Button>

            <Button
              variant="outline"
              disabled={!varianteId}
              onPress={() => setShowReservar((v) => !v)}
            >
              <Icon as={CalendarClock} size={16} className="text-foreground" />
              <Text>Reservar para probar en tienda</Text>
            </Button>
          </View>

          {showReservar && (
            <ReservarEnTiendaSheet onConfirm={handleReservar} isSubmitting={reservando} />
          )}

          {!varianteId && (
            <Text className="text-[11px] text-muted-foreground text-center">
              Elegí una talla y color para continuar.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
