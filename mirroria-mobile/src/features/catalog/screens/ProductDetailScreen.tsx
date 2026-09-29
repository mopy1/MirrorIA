import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarClock, ShoppingBag, Sparkles } from 'lucide-react-native';
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
  const [enCarrito, setEnCarrito] = useState(false);
  const [reservado, setReservado] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // La hoja de reserva aparece debajo de los botones, fuera de la vista:
  // se baja sola para que se note que se abrió.
  useEffect(() => {
    if (showReservar) setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [showReservar]);

  useEffect(() => {
    if (!id) return;
    catalogApi
      .getProducto(id)
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const image = product ? getPrimaryImageUrl(product.imagenes) ?? product.imagenes?.[0]?.url : null;

  // La prenda se ve siempre; el login se pide recién al querer comprar o reservar.
  const pedirLogin = () => router.push('/(auth)/login');

  async function handleAgregarAlCarrito() {
    if (!isAuthenticated || !user) return pedirLogin();
    if (!varianteId) return;
    setAddingToCart(true);
    setFeedback(null);
    try {
      await cartApi.addItem(user.id, varianteId, 1);
      setFeedback('Agregado al carrito ✓');
      setEnCarrito(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return pedirLogin();
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
      setFeedback('Reserva confirmada ✓');
      setReservado(true);
      setShowReservar(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return pedirLogin();
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

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={product.titulo} showLogo={false} showBack />
      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ aspectRatio: 4 / 5 }} className="w-full bg-muted/30">
          {image && (
            <Image source={{ uri: image }} className="w-full h-full" resizeMode="cover" />
          )}
        </View>

        <View className="p-4 gap-5">
          {image && (
            <Button
              variant="secondary"
              onPress={() =>
                router.push({ pathname: '/(tabs)/probador', params: { productoId: product.id } })
              }
            >
              <Icon as={Sparkles} size={16} className="text-secondary-foreground" />
              <Text>Probármela con IA</Text>
            </Button>
          )}

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

            {reservado && (
              <Button variant="secondary" onPress={() => router.push('/(tabs)/perfil')}>
                <Text>Ver mi Pase de Tienda</Text>
              </Button>
            )}

            {enCarrito && (
              <Button variant="secondary" onPress={() => router.push('/carrito')}>
                <Text>Ver carrito y pagar</Text>
              </Button>
            )}

            <Button
              variant="outline"
              disabled={!varianteId}
              onPress={() => (isAuthenticated ? setShowReservar((v) => !v) : pedirLogin())}
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
              Elegí color y talla para continuar.
            </Text>
          )}
          {!isAuthenticated && (
            <Text className="text-[11px] text-muted-foreground text-center">
              Para comprar o reservar te vamos a pedir que inicies sesión.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
