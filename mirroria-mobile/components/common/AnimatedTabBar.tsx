import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Pressable,
  Animated,
  Dimensions,
  Text,
} from 'react-native';
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
const CIRCLE_SIZE = 40;
const ICON_TOP_OFFSET = 6;
const BRAND_RED = '#7f1d3e';

export function AnimatedTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;
  const [layoutWidth, setLayoutWidth] = useState(screenWidth - 32);

  const activeIndex = state.index;
  const totalTabs = state.routes.length;

  // Guarda la posición X exacta y ancho de cada pestaña medida por el motor nativo
  const tabLayouts = useRef<Record<number, { x: number; width: number }>>({});

  const computeTargetX = (idx: number, width: number) => {
    const layout = tabLayouts.current[idx];
    if (layout && layout.width > 0) {
      return layout.x + (layout.width - CIRCLE_SIZE) / 2;
    }
    const tWidth = width > 0 ? width / totalTabs : (screenWidth - 32) / totalTabs;
    return idx * tWidth + (tWidth - CIRCLE_SIZE) / 2;
  };

  const translateX = useRef(
    new Animated.Value(computeTargetX(state.index, screenWidth - 32))
  ).current;
  const circleScale = useRef(new Animated.Value(1)).current;

  // Animación física de resorte fluido cuando cambia la pestaña activa
  useEffect(() => {
    const targetX = computeTargetX(activeIndex, layoutWidth);

    Animated.parallel([
      Animated.spring(translateX, {
        toValue: targetX,
        damping: 20,
        stiffness: 210,
        mass: 0.6,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(circleScale, {
          toValue: 1.14,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.spring(circleScale, {
          toValue: 1,
          friction: 4,
          tension: 190,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [activeIndex, layoutWidth]);

  const handleTabLayout = (index: number, x: number, width: number) => {
    tabLayouts.current[index] = { x, width };
    // Si es la pestaña activa actual en el primer render, calibra la posición inmediatamente
    if (index === activeIndex) {
      const calibratedX = x + (width - CIRCLE_SIZE) / 2;
      translateX.setValue(calibratedX);
    }
  };

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

  const tabPercent = `${100 / totalTabs}%` as const;

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
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && Math.abs(w - layoutWidth) > 2) {
            setLayoutWidth(w);
          }
        }}
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
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* CÍRCULO ROJO FLOTANTE PERFECTAMENTE CONCÉNTRICO */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: ICON_TOP_OFFSET,
            left: 0,
            width: CIRCLE_SIZE,
            height: CIRCLE_SIZE,
            borderRadius: CIRCLE_SIZE / 2,
            backgroundColor: BRAND_RED,
            shadowColor: BRAND_RED,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.18,
            shadowRadius: 4,
            elevation: 2,
            transform: [{ translateX }, { scale: circleScale }],
          }}
        />

        {/* 4 PESTAÑAS TÁCTILES DISTRIBUIDAS AL 25% CADA UNA */}
        {state.routes.map((route, index) => {
          const config = TAB_CONFIG[route.name] ?? {
            label: route.name,
            icon: Sparkles,
          };
          const isFocused = state.index === index;
          const IconComponent = config.icon;

          return (
            <Pressable
              key={route.key}
              onLayout={(e) => {
                const { x, width } = e.nativeEvent.layout;
                handleTabLayout(index, x, width);
              }}
              onPress={() => handlePress(route.name, index)}
              style={({ pressed }) => ({
                width: tabPercent as any,
                flexGrow: 1,
                flexBasis: tabPercent as any,
                height: DOCK_HEIGHT,
                alignItems: 'center',
                zIndex: 10,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              {/* Contenedor del ícono anclado al mismo TOP y SIZE que el círculo */}
              <View
                style={{
                  marginTop: ICON_TOP_OFFSET,
                  width: CIRCLE_SIZE,
                  height: CIRCLE_SIZE,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconComponent
                  size={20}
                  color={isFocused ? '#ffffff' : '#6b7280'}
                  strokeWidth={isFocused ? 2.2 : 1.8}
                />
              </View>

              {/* Etiqueta de texto debajo del ícono */}
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 10,
                  lineHeight: 13,
                  fontWeight: isFocused ? '700' : '500',
                  color: isFocused ? BRAND_RED : '#6b7280',
                  marginTop: 2,
                  textAlign: 'center',
                  includeFontPadding: false,
                }}
              >
                {config.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
