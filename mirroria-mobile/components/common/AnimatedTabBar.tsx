import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import {
  Sparkles,
  ShoppingBag,
  Glasses,
  User,
  type LucideIcon,
} from 'lucide-react-native';

const TAB_CONFIG: Record<string, { label: string; icon: LucideIcon }> = {
  index: { label: 'Inicio', icon: Sparkles },
  catalogo: { label: 'Catálogo', icon: ShoppingBag },
  probador: { label: 'Vestidor 3D', icon: Glasses },
  perfil: { label: 'Perfil', icon: User },
};

const DOCK_HEIGHT = 70;
const BRAND_RED = '#7f1d3e';

export function AnimatedTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const handlePress = (routeName: string, index: number) => {
    const isFocused = state.index === index;
    const event = navigation.emit({
      type: 'tabPress',
      target: state.routes[index].key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  return (
    <View
      style={{
        paddingBottom: Math.max(insets.bottom + 8, 20),
        paddingHorizontal: 16,
        paddingTop: 4,
        width: '100%',
        backgroundColor: '#ffffff',
      }}
    >
      <View
        style={{
          width: '100%',
          height: DOCK_HEIGHT,
          borderRadius: DOCK_HEIGHT / 2,
          backgroundColor: '#ffffff',
          borderWidth: 1,
          borderColor: 'rgba(0, 0, 0, 0.08)',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        {/* Sin fondo, sin animación: el ícono y la etiqueta cambian de color
            cuando la pestaña está enfocada, más un puntito debajo — mismo
            criterio simple que un BottomNavigationBar de Flutter/Material. */}
        {state.routes.map((route, index) => {
          const config = TAB_CONFIG[route.name] ?? {
            label: route.name,
            icon: Sparkles,
          };
          const isFocused = state.index === index;
          const IconComponent = config.icon;
          const color = isFocused ? BRAND_RED : '#6b7280';

          return (
            <Pressable
              key={route.key}
              onPress={() => handlePress(route.name, index)}
              style={({ pressed }) => ({
                flex: 1,
                height: DOCK_HEIGHT,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              {/* Ancho explícito (no intrínseco) para que textAlign:'center'
                  centre de verdad, incluso con la etiqueta más larga
                  ("Vestidor 3D") — sin esto, el texto se centra contra su
                  propio ancho de contenido, no contra la columna. */}
              <View style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <IconComponent size={22} color={color} strokeWidth={isFocused ? 2.4 : 1.8} />

                <Text
                  numberOfLines={1}
                  style={{
                    width: '100%',
                    fontSize: 10,
                    lineHeight: 13,
                    fontWeight: isFocused ? '700' : '500',
                    color,
                    marginTop: 4,
                    textAlign: 'center',
                    includeFontPadding: false,
                  }}
                >
                  {config.label}
                </Text>

                <View
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    marginTop: 3,
                    backgroundColor: isFocused ? BRAND_RED : 'transparent',
                  }}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
