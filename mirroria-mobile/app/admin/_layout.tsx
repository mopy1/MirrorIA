import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';
import { esEquipo } from '@/src/features/auth/lib/destino';

/** Panel de la tienda: solo el equipo (ADMIN, ENCARGADO_SUCURSAL, CAJERO). Cada pantalla valida su rol. */
export default function AdminLayout() {
  const { user } = useAuth();
  if (!user) return <Redirect href="/(auth)/login" />;
  if (!esEquipo(user.role)) return <Redirect href="/(tabs)" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
