import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { SearchInput } from '../components/SearchInput';
import { CategoryChips } from '../components/CategoryChips';
import { ProductCardMobile } from '../components/ProductCardMobile';
import { CatalogSkeleton } from '../components/CatalogSkeleton';
import { CatalogEmptyState } from '../components/CatalogEmptyState';
import { catalogApi } from '../api/catalogApi';
import type {
  ProductoResponseDto,
  CategoriaResponseDto,
} from '../types/catalog.types';

export function CatalogScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductoResponseDto[]>([]);
  const [categories, setCategories] = useState<CategoriaResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );

  const loadData = useCallback(async () => {
    try {
      const [prodsData, catsData] = await Promise.all([
        catalogApi.getProductos().catch(() => []),
        catalogApi.getCategorias().catch(() => []),
      ]);
      setProducts(prodsData.filter((p) => p.activo));
      setCategories(catsData.filter((c) => c.activo));
    } catch (err) {
      console.error('[CatalogScreen] Error cargando datos:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        !selectedCategoryId || p.categoriaId === selectedCategoryId;
      const matchesSearch =
        !search.trim() ||
        p.titulo.toLowerCase().includes(search.toLowerCase().trim());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategoryId, search]);

  const handlePressProduct = (product: ProductoResponseDto) => {
    if (product.modeloArUrl) {
      router.push('/(tabs)/probador');
    }
  };

  const handlePressTryOn = (_product: ProductoResponseDto) => {
    router.push('/(tabs)/probador');
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title="Catálogo"
        subtitle="Prendas exclusivas & Probador 3D"
        showLogo={false}
      />

      <View className="px-4 pt-3 pb-1">
        <SearchInput value={search} onChangeText={setSearch} />
      </View>

      <CategoryChips
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
      />

      {loading ? (
        <CatalogSkeleton />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <ProductCardMobile
              product={item}
              onPress={handlePressProduct}
              onPressTryOn={handlePressTryOn}
            />
          )}
          ListEmptyComponent={
            <CatalogEmptyState
              onReset={() => {
                setSearch('');
                setSelectedCategoryId(null);
              }}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#7f1d3e']}
              tintColor="#7f1d3e"
            />
          }
        />
      )}
    </View>
  );
}
