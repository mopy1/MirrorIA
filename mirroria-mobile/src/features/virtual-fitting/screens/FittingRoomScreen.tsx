import React, { useEffect, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { FittingRoomHeader } from '../components/FittingRoomHeader';
import { CameraStage } from '../components/CameraStage';
import { GarmentSelectorBar } from '../components/GarmentSelectorBar';
import { FittingActionRow } from '../components/FittingActionRow';
import { catalogApi } from '@/src/features/catalog/api/catalogApi';
import { formatMoney } from '@/src/lib/money';
import { Text } from '@/components/ui/text';
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
          // Preferir un producto que ya tenga imagen real de AR cargada
          // Preferir uno con modelo 3D: es lo que mejor muestra el
          // Vestidor. Si no hay, el que tenga al menos overlay 2D.
          const with3D = activeProds.find((p) => Boolean(p.modeloArUrl));
          const withOverlay = activeProds.find((p) =>
            Boolean(p.arOverlayImageUrl)
          );
          setSelectedProduct(with3D ?? withOverlay ?? activeProds[0]);
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

  return (
    <View className="flex-1 bg-background">
      <FittingRoomHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 36 }}
      >
        <CameraStage
          arOverlayImageUrl={selectedProduct?.arOverlayImageUrl}
          modeloArUrl={selectedProduct?.modeloArUrl}
        />

        <View className="items-center -mt-2">
          <Text className="text-sm font-bold text-center text-foreground">
            {garmentTitle}
          </Text>
          <Text className="text-xs font-semibold text-primary mt-0.5">
            {garmentPriceFormatted}
          </Text>
        </View>

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
