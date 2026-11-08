import { Tabs } from 'expo-router/js-tabs';
import { ShoppingBag, Sparkle, Storefront, UserCircle, type Icon as PhosphorIcon } from 'phosphor-react-native';
import { useTema } from '@/contexts/TemaContext';
import { useCarritoLocal } from '@/features/carrito/hooks/use-carrito-local';
import { useOutbox } from '@/lib/outbox/use-outbox';
import { textoSobre } from '@/lib/tema/color';

const icono = (Componente: PhosphorIcon) =>
  function IconoTab({ color, focused }: { color: unknown; focused: boolean }) {
    return <Componente size={24} color={String(color)} weight={focused ? 'fill' : 'regular'} />;
  };

/** Tabs de la clienta y la visitante: Vitrina · Probador · Carrito · Mis cosas. */
export default function TabsLayout() {
  const { colores } = useTema();
  const carrito = useCarritoLocal();
  const unidades = (carrito.data ?? []).reduce((s, i) => s + i.cantidad, 0);
  const porEnviar = useOutbox().pendientes;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colores.primary,
        tabBarInactiveTintColor: colores['muted-foreground'],
        tabBarStyle: { backgroundColor: colores.background, borderTopColor: colores.border },
        tabBarLabelStyle: { fontFamily: 'Geist_500Medium', fontSize: 11 },
        tabBarBadgeStyle: { backgroundColor: colores.primary, color: colores['primary-foreground'], fontFamily: 'GeistMono_500Medium', fontSize: 10 },
        sceneStyle: { backgroundColor: colores.background },
      }}
    >
      <Tabs.Screen name="vitrina" options={{ title: 'Vitrina', tabBarIcon: icono(Storefront) }} />
      <Tabs.Screen name="probador" options={{ title: 'Probador', tabBarIcon: icono(Sparkle) }} />
      <Tabs.Screen name="carrito" options={{ title: 'Carrito', tabBarIcon: icono(ShoppingBag), tabBarBadge: unidades || undefined }} />
      <Tabs.Screen
        name="mis-cosas"
        options={{
          title: 'Mis cosas',
          tabBarIcon: icono(UserCircle),
          // Ámbar = operaciones guardadas sin enviar (RN09), igual que el badge "Pendiente de confirmar".
          tabBarBadge: porEnviar || undefined,
          tabBarBadgeStyle: { backgroundColor: colores.warning, color: textoSobre(colores.warning), fontFamily: 'GeistMono_500Medium', fontSize: 10 },
        }}
      />
    </Tabs>
  );
}
