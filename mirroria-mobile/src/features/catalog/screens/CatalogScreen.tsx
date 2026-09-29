import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, FlatList, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ShoppingBag } from 'lucide-react-native';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { Icon } from '@/components/ui/icon';
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
    router.push(`/producto/${product.id}`);
  };

  const handlePressTryOn = (product: ProductoResponseDto) => {
    router.push({ pathname: '/(tabs)/probador', params: { productoId: product.id } });
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title="Catálogo"
        subtitle="Prendas exclusivas & Probador IA"
        showLogo={false}
        rightAction={
          <Pressable
            onPress={() => router.push('/carrito')}
            hitSlop={8}
            className="w-9 h-9 items-center justify-center rounded-full active:bg-muted"
          >
            <Icon as={ShoppingBag} size={20} className="text-foreground" />
          </Pressable>
        }
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
          // Android recorta (oculta) vistas hermanas fuera de una heurística
          // de bounding box cuando hay imágenes pesadas en la lista — el
          // texto debajo de la imagen (título/precio) desaparecía en
          // algunas tarjetas al scrollear, aunque el dato llegaba bien
          // (confirmado: la ficha de detalle del mismo producto sí lo
          // mostraba). Desactivar el "clipping" cuesta memoria, aceptable
          // para un catálogo de este tamaño.
          removeClippedSubviews={false}
          contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 24 }}
          // Ancho fijo de media columna: con flex-1, una prenda sola en la
          // última fila (o un único resultado de búsqueda) ocupaba todo el ancho.
          renderItem={({ item }) => (
            <View style={{ width: '50%' }}>
              <ProductCardMobile
                product={item}
                onPress={handlePressProduct}
                onPressTryOn={handlePressTryOn}
              />
            </View>
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
