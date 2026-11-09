import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Seccion } from '@/components/admin/Seccion';
import { Text } from '@/components/ui/text';
import type { AlertaStockItemDto } from '../../types/dashboard.types';
import { EtiquetaTono } from '../comun/EtiquetaTono';

interface Props {
  alertas: AlertaStockItemDto[];
  /** La cajera no puede abrir Inventario: no se le muestra el acceso. */
  puedeVerInventario: boolean;
}

export function StockPorAgotarse({ alertas, puedeVerInventario }: Props) {
  const router = useRouter();
  const accion =
    puedeVerInventario && alertas.length > 0 ? (
      <Pressable onPress={() => router.push('/admin/inventario')} hitSlop={8}>
        <Text className="text-sm font-semibold text-primary">Revisar stock</Text>
      </Pressable>
    ) : undefined;

  return (
    <Seccion titulo="Stock por agotarse" accion={accion}>
      {alertas.length === 0 ? (
        <Text className="text-sm text-muted-foreground">
          Todo con stock. Te avisamos aquí cuando una prenda baje de 3 unidades en esta sucursal.
        </Text>
      ) : (
        <>
          <Text className="text-xs text-muted-foreground">Tallas y colores con 2 unidades o menos</Text>
          {alertas.map((a) => (
            <View key={a.inventarioId} className="flex-row items-center justify-between gap-3 border-t border-border/70 pt-2.5">
              <View className="flex-1">
                <Text className="text-sm font-medium">{a.productoNombre}</Text>
                <Text className="text-xs text-muted-foreground">
                  Talla {a.talla} · {a.color}
                </Text>
              </View>
              {a.nivel === 'AGOTADO' ? (
                <EtiquetaTono tono="mal">Agotada</EtiquetaTono>
              ) : (
                <EtiquetaTono tono="atencion">
                  {a.stockDisponible === 1 ? 'Queda 1' : `Quedan ${a.stockDisponible}`}
                </EtiquetaTono>
              )}
            </View>
          ))}
        </>
      )}
    </Seccion>
  );
}
