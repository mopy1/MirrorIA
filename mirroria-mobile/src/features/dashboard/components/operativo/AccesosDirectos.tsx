import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';
import { Banknote, CalendarDays, Calculator, Package, Warehouse } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { UsuarioRole } from '@/src/features/auth/types/auth.types';
import { accesosParaRol, type IdAcceso } from '../../lib/vista-rol';

const ICONOS: Record<IdAcceso, LucideIcon> = {
  mostrador: Calculator,
  cobros: Banknote,
  reservas: CalendarDays,
  inventario: Warehouse,
  catalogo: Package,
};

/** Botones grandes a las pantallas del panel que el rol puede abrir. */
export function AccesosDirectos({ rol }: { rol?: UsuarioRole }) {
  const router = useRouter();
  const accesos = accesosParaRol(rol);
  if (accesos.length === 0) return null;
  return (
    <View className="flex-row flex-wrap gap-2.5">
      {accesos.map((a, i) => {
        const principal = i === 0;
        return (
          <Pressable
            key={a.id}
            onPress={() => router.push(a.href as Href)}
            accessibilityRole="button"
            className={cn(
              'min-w-[47%] flex-1 flex-row items-center gap-2.5 rounded-2xl border px-3.5 py-3.5',
              principal ? 'border-primary bg-primary active:bg-primary/90' : 'border-border bg-card active:bg-muted'
            )}>
            <Icon as={ICONOS[a.id]} size={20} className={principal ? 'text-primary-foreground' : 'text-primary'} />
            <Text className={cn('flex-1 text-sm font-semibold', principal && 'text-primary-foreground')}>{a.texto}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
