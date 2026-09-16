import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { useAuth } from '@/src/hooks/useAuth';
import { Text } from '@/components/ui/text';
import { HeroBanner } from '../components/HeroBanner';
import { QuickActionsBar } from '../components/QuickActionsBar';
import { FeaturedCarousel } from '../components/FeaturedCarousel';
import { StorePassTeaser } from '../components/StorePassTeaser';
import { catalogApi } from '@/src/features/catalog/api/catalogApi';
import type { ProductoResponseDto } from '@/src/features/catalog/types/catalog.types';

export function FeedScreen() {
  const { user, isAuthenticated } = useAuth();
  const [products, setProducts] = useState<ProductoResponseDto[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadFeedData = useCallback(async () => {
    try {
      const data = await catalogApi.getProductos().catch(() => []);
      setProducts(data.filter((p) => p.activo));
    } catch (err) {
      console.error('[FeedScreen] Error cargando feed:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFeedData();
  }, [loadFeedData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadFeedData();
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader showLogo={true} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#7f1d3e']}
            tintColor="#7f1d3e"
          />
        }
      >
        {isAuthenticated && user && (
          <View className="flex-row items-center justify-between px-1">
            <View>
              <Text className="text-lg font-bold text-foreground">
                Hola, {user.fullName.split(' ')[0]} ✨
              </Text>
              <Text className="text-xs text-muted-foreground">
                Bienvenida a tu boutique MirrorIA
              </Text>
            </View>
          </View>
        )}

        <HeroBanner />

        <QuickActionsBar />

        <FeaturedCarousel products={products} />

        <StorePassTeaser />
      </ScrollView>
    </View>
  );
}
