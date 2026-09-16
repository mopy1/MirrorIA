import React, { useEffect, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { FittingRoomHeader } from '../components/FittingRoomHeader';
import { FittingStagePreview } from '../components/FittingStagePreview';
import { GarmentSelectorBar } from '../components/GarmentSelectorBar';
import { FittingActionRow } from '../components/FittingActionRow';
import { catalogApi } from '@/src/features/catalog/api/catalogApi';
import { formatMoney } from '@/src/lib/money';
import type { ProductoResponseDto } from '@/src/features/catalog/types/catalog.types';

export function FittingRoomScreen() {
  const [products, setProducts] = useState<ProductoResponseDto[]>([]);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductoResponseDto | null>(null);

  useEffect(() => {
    let isMounted = true;
    catalogApi
      .getProductos()
      .then((data) => {
        if (!isMounted) return;
        const activeProds = data.filter((p) => p.activo);
        setProducts(activeProds);
        if (activeProds.length > 0) {
          // Preferir un producto con modelo 3D si existe
          const with3D = activeProds.find((p) => Boolean(p.modeloArUrl));
          setSelectedProduct(with3D ?? activeProds[0]);
        }
      })
      .catch((err) =>
        console.error('[FittingRoomScreen] Error cargando prendas:', err)
      );

    return () => {
      isMounted = false;
    };
  }, []);

  const garmentTitle = selectedProduct
    ? selectedProduct.titulo
    : 'Prenda de Colección MirrorIA';

  const garmentPriceFormatted = selectedProduct
    ? formatMoney(selectedProduct.precioCents)
    : 'Bs 0.00';

  const hasModel3D = Boolean(selectedProduct?.modeloArUrl);

  return (
    <View className="flex-1 bg-background">
      <FittingRoomHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 36 }}
      >
        <FittingStagePreview
          garmentTitle={garmentTitle}
          garmentPriceFormatted={garmentPriceFormatted}
          hasModel3D={hasModel3D}
        />

        <GarmentSelectorBar
          products={products}
          selectedProduct={selectedProduct}
          onSelect={setSelectedProduct}
        />

        <FittingActionRow />
      </ScrollView>
    </View>
  );
}
