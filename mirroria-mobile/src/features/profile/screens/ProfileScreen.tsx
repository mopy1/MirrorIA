import React from 'react';
import { View, ScrollView } from 'react-native';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { useAuth } from '@/src/hooks/useAuth';
import { ProfileHeader } from '../components/ProfileHeader';
import { GuestPromptCard } from '../components/GuestPromptCard';
import { StorePassCard } from '../components/StorePassCard';
import { ProfileNavigationMenu } from '../components/ProfileNavigationMenu';
import { TiendaActualCard } from '../components/TiendaActualCard';

export function ProfileScreen() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title="Mi Perfil"
        subtitle="Tu cuenta y tu tienda"
        showLogo={false}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 120 }}
      >
        {isAuthenticated && user ? (
          <>
            <ProfileHeader user={user} onLogout={logout} />
            <StorePassCard />
          </>
        ) : (
          <GuestPromptCard />
        )}

        <ProfileNavigationMenu />
        <TiendaActualCard />
      </ScrollView>
    </View>
  );
}
