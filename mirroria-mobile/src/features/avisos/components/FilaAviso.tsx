import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Trash } from 'phosphor-react-native';
import { Pressable, View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { AvisoLocal } from '@/lib/db/repos/avisos.repo';
import { haceCuanto } from '@/lib/formato/fechas';
import { BadgeAviso } from './BadgeAviso';

/** Fila de 96 px: foto, prenda, talla/color, estado y "Quitar". Tocar abre la ficha con esa variante. */
export function FilaAviso({ aviso, onQuitar }: { aviso: AvisoLocal; onQuitar: () => void }) {
  const abrir = () =>
    aviso.productoId && router.push({ pathname: '/vitrina/[productoId]', params: { productoId: aviso.productoId, variante: aviso.varianteId } });
  return (
    <View className="flex-row items-center gap-3 border-b border-border py-4">
      <Pressable onPress={abrir} disabled={!aviso.productoId} accessibilityRole="button" className="flex-1 flex-row gap-4 active:opacity-80">
        <View className="h-24 w-[72px] overflow-hidden rounded-md bg-muted">
          {aviso.imagen ? <Image source={aviso.imagen} style={{ flex: 1 }} contentFit="cover" /> : null}
        </View>
        <View className="flex-1 justify-between py-0.5">
          <View>
            <Text className="font-body-medium text-sm" numberOfLines={2}>
              {aviso.prenda ?? 'Prenda que ya no está en la vitrina'}
            </Text>
            {aviso.talla ? <Text className="mt-0.5 text-xs text-muted-foreground">Talla {aviso.talla} · {aviso.color}</Text> : null}
          </View>
          <BadgeAviso libre={aviso.libre} />
          <Text className="text-[11px] text-muted-foreground">
            {aviso.libre > 0 && aviso.sucursalConStock ? `En ${aviso.sucursalConStock} · ` : ''}Activado {haceCuanto(aviso.creadoEn)}
          </Text>
        </View>
      </Pressable>
      <Pressable onPress={onQuitar} hitSlop={8} accessibilityRole="button" accessibilityLabel="Quitar aviso" className="h-11 w-11 items-center justify-center rounded-full active:bg-danger/10">
        <Icon as={Trash} size={20} className="text-muted-foreground" />
      </Pressable>
    </View>
  );
}
