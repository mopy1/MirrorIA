import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeftRight, Briefcase, ChevronRight, Store, type LucideIcon } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { LogoTienda } from '@/src/features/saas/components/LogoTienda';
import { useMarcaTienda } from '@/src/features/saas/hooks/useMarcaTienda';

/** La tienda en la que está la app y los accesos de la plataforma (cambiar, crear, entrar como equipo). */
export function TiendaActualCard() {
  const router = useRouter();
  const { slug, marca } = useMarcaTienda();

  const acciones: { titulo: string; detalle: string; icono: LucideIcon; ir: () => void }[] = [
    { titulo: 'Cambiar de tienda', detalle: 'Elegí otra tienda creada con MirrorIA', icono: ArrowLeftRight, ir: () => router.push('/saas/tiendas') },
    { titulo: 'Crear mi tienda', detalle: 'Abrí tu tienda online con prueba gratis', icono: Store, ir: () => router.push('/saas/registro') },
    { titulo: 'Soy del equipo: entrar', detalle: 'Dueña, encargada o cajera de una tienda', icono: Briefcase, ir: () => router.push({ pathname: '/saas/tiendas', params: { para: 'equipo' } }) },
  ];

  return (
    <View className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
      <View className="flex-row items-center gap-3 p-4">
        <LogoTienda nombre={marca?.nombre ?? slug} logoUrl={marca?.logoUrl ?? null} color={marca?.colorPrimario ?? null} tamano={44} />
        <View className="flex-1">
          <Text className="text-[11px] uppercase tracking-wider text-muted-foreground">Estás en la tienda</Text>
          <Text numberOfLines={1} className="text-base font-semibold text-foreground">{marca?.nombre ?? slug}</Text>
          {marca && !marca.disponible && (
            <Text className="text-xs font-medium text-amber-700">Esta tienda no está disponible por el momento.</Text>
          )}
        </View>
      </View>
      {acciones.map((a) => (
        <Pressable key={a.titulo} onPress={a.ir} className="flex-row items-center gap-3.5 border-t border-border/40 p-4 active:bg-muted/50">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-muted/60">
            <Icon as={a.icono} size={20} className="text-foreground" />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-semibold text-foreground">{a.titulo}</Text>
            <Text className="mt-0.5 text-[10px] text-muted-foreground">{a.detalle}</Text>
          </View>
          <Icon as={ChevronRight} size={16} className="text-muted-foreground" />
        </Pressable>
      ))}
    </View>
  );
}
