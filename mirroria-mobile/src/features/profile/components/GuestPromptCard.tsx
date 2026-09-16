import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { UserPlus, LogIn, Sparkles } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

export function GuestPromptCard() {
  const router = useRouter();

  return (
    <View className="rounded-3xl bg-card border border-border/80 p-6 shadow-sm items-center text-center gap-4">
      <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center">
        <Icon as={Sparkles} size={30} className="text-primary" />
      </View>

      <View className="items-center gap-1.5">
        <Text className="text-xl font-bold text-foreground text-center">
          Iniciá sesión en MirrorIA
        </Text>
        <Text className="text-xs text-muted-foreground text-center leading-relaxed max-w-[280px]">
          Guardá tus medidas para el vestidor 3D, apartá prendas para probarte en tienda y disfrutá de atención personalizada.
        </Text>
      </View>

      <View className="w-full gap-2.5 pt-2">
        <Button
          size="lg"
          onPress={() => router.push('/(auth)/login')}
          className="w-full flex-row items-center justify-center gap-2"
        >
          <Icon as={LogIn} size={18} className="text-primary-foreground" />
          <Text className="font-semibold text-sm text-primary-foreground">
            Iniciar sesión
          </Text>
        </Button>

        <Button
          variant="outline"
          size="lg"
          onPress={() => router.push('/(auth)/register')}
          className="w-full flex-row items-center justify-center gap-2"
        >
          <Icon as={UserPlus} size={18} className="text-foreground" />
          <Text className="font-semibold text-sm text-foreground">
            Crear cuenta nueva
          </Text>
        </Button>
      </View>
    </View>
  );
}
