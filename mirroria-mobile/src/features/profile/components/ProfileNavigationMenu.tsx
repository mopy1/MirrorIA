import React from 'react';
import { View, Pressable } from 'react-native';
import {
  Ruler,
  ShoppingBag,
  MapPin,
  MessageCircle,
  ChevronRight,
} from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';

export function ProfileNavigationMenu() {
  const menuItems = [
    {
      title: 'Mis Medidas & Avatar 3D',
      subtitle: 'Configurá tu figura para el probador',
      icon: Ruler,
    },
    {
      title: 'Mis Pedidos & Compras',
      subtitle: 'Historial y comprobantes',
      icon: ShoppingBag,
    },
    {
      title: 'Sucursales & Probadores Físicos',
      subtitle: 'Direcciones y horarios de atención',
      icon: MapPin,
    },
    {
      title: 'Asesoría de Imagen por WhatsApp',
      subtitle: 'Consultas directas con estilistas',
      icon: MessageCircle,
    },
  ];

  return (
    <View className="rounded-3xl bg-card border border-border/70 overflow-hidden shadow-sm">
      {menuItems.map((item, index) => (
        <Pressable
          key={item.title}
          className={`p-4 flex-row items-center justify-between active:bg-muted/50 ${
            index > 0 ? 'border-t border-border/40' : ''
          }`}
        >
          <View className="flex-row items-center gap-3.5 flex-1">
            <View className="w-10 h-10 rounded-xl bg-muted/60 items-center justify-center">
              <Icon as={item.icon} size={20} className="text-foreground" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-foreground">
                {item.title}
              </Text>
              <Text className="text-[10px] text-muted-foreground mt-0.5">
                {item.subtitle}
              </Text>
            </View>
          </View>
          <Icon as={ChevronRight} size={16} className="text-muted-foreground" />
        </Pressable>
      ))}
    </View>
  );
}
