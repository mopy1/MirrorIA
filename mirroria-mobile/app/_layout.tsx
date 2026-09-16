import '@/global.css';

import React, { useEffect } from 'react';
import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from 'expo-router/react-navigation';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { AuthProvider } from '@/src/context/AuthContext';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const { setColorScheme } = useColorScheme();

  // Forzar siempre modo claro ("blanco siempre")
  useEffect(() => {
    setColorScheme('light');
  }, [setColorScheme]);

  return (
    <AuthProvider>
      <ThemeProvider value={NAV_THEME.light}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
        <PortalHost />
      </ThemeProvider>
    </AuthProvider>
  );
}
