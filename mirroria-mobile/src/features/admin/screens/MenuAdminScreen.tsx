import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ArrowLeftRight, ChevronRight, LogOut, Store } from 'lucide-react-native';
import { PantallaAdmin } from '@/components/admin/PantallaAdmin';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/src/hooks/useAuth';
import { MENU_INICIO, menuParaRol, type ItemMenu } from '../lib/menu-admin';

const NOMBRE_ROL: Record<string, string> = {
  ADMIN: 'Dueña / administradora',
  ENCARGADO_SUCURSAL: 'Encargada de sucursal',
  CAJERO: 'Cajera',
};

function Fila({ item, onPress }: { item: ItemMenu; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-3 px-4 py-3.5 active:bg-muted">
      <Icon as={item.icon} size={20} className="text-primary" />
      <Text className="flex-1 text-base">{item.label}</Text>
      <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
    </Pressable>
  );
}

/** Portada del panel: el mismo menú de la web, filtrado por el rol de quien entra. */
export function MenuAdminScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const ir = (href: string) => router.push(href as Href);

  return (
    <PantallaAdmin titulo={user?.tenant?.nombre ?? 'Mi tienda'} subtitulo={`${user?.fullName ?? ''} · ${NOMBRE_ROL[user?.role ?? ''] ?? ''}`} volver={false}>
      <View className="rounded-2xl border border-border bg-card overflow-hidden">
        <Fila item={MENU_INICIO} onPress={() => ir(MENU_INICIO.href)} />
      </View>
      {menuParaRol(user?.role).map((g) => (
        <View key={g.id} className="gap-2">
          <Text className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.title}</Text>
          <View className="rounded-2xl border border-border bg-card overflow-hidden">
            {g.items.map((i) => (
              <Fila key={i.href} item={i} onPress={() => ir(i.href)} />
            ))}
          </View>
        </View>
      ))}
      <View className="rounded-2xl border border-border bg-card overflow-hidden">
        <Pressable onPress={() => router.push('/(tabs)')} className="flex-row items-center gap-3 px-4 py-3.5 active:bg-muted">
          <Icon as={Store} size={20} className="text-foreground" />
          <Text className="flex-1 text-base">Ver mi tienda</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/saas/tiendas?para=equipo')} className="flex-row items-center gap-3 px-4 py-3.5 active:bg-muted">
          <Icon as={ArrowLeftRight} size={20} className="text-foreground" />
          <Text className="flex-1 text-base">Cambiar de tienda</Text>
        </Pressable>
        <Pressable
          onPress={async () => {
            await logout();
            router.replace('/(tabs)');
          }}
          className="flex-row items-center gap-3 px-4 py-3.5 active:bg-muted"
        >
          <Icon as={LogOut} size={20} className="text-destructive" />
          <Text className="flex-1 text-base text-destructive">Cerrar sesión</Text>
        </Pressable>
      </View>
    </PantallaAdmin>
  );
}
