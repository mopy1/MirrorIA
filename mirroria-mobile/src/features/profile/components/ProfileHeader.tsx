import React from 'react';
import { View } from 'react-native';
import { LogOut } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import type { UsuarioResponse } from '@/src/features/auth/types/auth.types';

interface ProfileHeaderProps {
  user: UsuarioResponse;
  onLogout: () => void;
}

export function ProfileHeader({ user, onLogout }: ProfileHeaderProps) {
  const initials = user.fullName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <View className="rounded-3xl bg-card border border-border/70 p-5 shadow-sm">
      <View className="flex-row items-center gap-4">
        {/* Avatar Circular con Iniciales */}
        <View className="w-16 h-16 rounded-full bg-primary items-center justify-center shadow-md">
          <Text className="text-xl font-black text-primary-foreground tracking-wider">
            {initials}
          </Text>
        </View>

        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-base font-bold text-foreground">
              {user.fullName}
            </Text>
            <Badge variant="outline" className="border-primary/30 bg-primary/10">
              <Text className="text-[10px] font-bold text-primary">CLIENTA</Text>
            </Badge>
          </View>
          <Text className="text-xs text-muted-foreground">{user.email}</Text>
        </View>
      </View>

      <View className="mt-4 pt-3 border-t border-border/40 flex-row justify-end">
        <Button
          variant="outline"
          size="sm"
          onPress={onLogout}
          className="flex-row items-center gap-1.5 border-destructive/30"
        >
          <Icon as={LogOut} size={14} className="text-destructive" />
          <Text className="text-xs font-semibold text-destructive">
            Cerrar sesión
          </Text>
        </Button>
      </View>
    </View>
  );
}
