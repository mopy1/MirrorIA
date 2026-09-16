import React from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ShoppingBag,
  Glasses,
  Ticket,
  Sparkles,
} from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';

export function QuickActionsBar() {
  const router = useRouter();

  const actions = [
    {
      title: 'Catálogo',
      subtitle: 'Vitrina táctil',
      icon: ShoppingBag,
      color: 'bg-primary/10 text-primary',
      onPress: () => router.push('/(tabs)/catalogo'),
    },
    {
      title: 'Vestidor 3D',
      subtitle: 'Probate ropa',
      icon: Glasses,
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
      onPress: () => router.push('/(tabs)/probador'),
    },
    {
      title: 'Pase Tienda',
      subtitle: 'Retiro y citas',
      icon: Ticket,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      onPress: () => router.push('/(tabs)/perfil'),
    },
    {
      title: 'Tendencias',
      subtitle: 'Top elegidos',
      icon: Sparkles,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      onPress: () => router.push('/(tabs)/catalogo'),
    },
  ];

  return (
    <View className="gap-2.5">
      <Text className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
        Accesos directos
      </Text>
      <View className="flex-row flex-wrap justify-between gap-y-2.5">
        {actions.map((act) => (
          <Pressable
            key={act.title}
            onPress={act.onPress}
            style={{ width: '48.5%' }}
            className="p-3.5 rounded-2xl bg-card border border-border/70 flex-row items-center gap-2.5 active:opacity-80"
          >
            <View className={`w-10 h-10 rounded-xl items-center justify-center ${act.color.split(' ')[0]}`}>
              <Icon as={act.icon} size={20} className={act.color.split(' ')[1]} />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-foreground">
                {act.title}
              </Text>
              <Text className="text-[10px] text-muted-foreground">
                {act.subtitle}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
