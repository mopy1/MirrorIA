import React from 'react';
import { View, ScrollView } from 'react-native';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { useAuth } from '@/src/hooks/useAuth';
import { ProfileHeader } from '../components/ProfileHeader';
import { GuestPromptCard } from '../components/GuestPromptCard';
import { StorePassCard } from '../components/StorePassCard';
import { ProfileNavigationMenu } from '../components/ProfileNavigationMenu';

export function ProfileScreen() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title="Mi Perfil"
        subtitle="Experiencia MirrorIA & Tienda"
        showLogo={false}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 36 }}
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
      </ScrollView>
    </View>
  );
}
