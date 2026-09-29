import React from 'react';
import { Tabs } from 'expo-router';
import { AnimatedTabBar } from '@/components/common/AnimatedTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="catalogo" options={{ title: 'Catálogo' }} />
      <Tabs.Screen name="probador" options={{ title: 'Probador IA' }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
