import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { AlertCircle } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/src/hooks/useAuth';
import { esErrorDeLimite } from '../../lib/comunes';

/**
 * Muestra el mensaje del backend. Si es el límite del plan (409 que nombra al plan),
 * suma "Ver mi plan" → /admin/suscripcion (solo ADMIN), igual que ErrorConPlan de la web.
 */
export function AvisoError({ mensaje }: { mensaje: string | null | undefined }) {
  const { user } = useAuth();
  const router = useRouter();
  if (!mensaje) return null;
  const verPlan = esErrorDeLimite(mensaje) && user?.role === 'ADMIN';
  return (
    <View className="gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3">
      <View className="flex-row items-start gap-2">
        <Icon as={AlertCircle} size={18} className="text-destructive mt-0.5" />
        <Text className="flex-1 text-sm text-destructive">{mensaje}</Text>
      </View>
      {verPlan ? (
        <Button variant="outline" size="sm" className="self-start" onPress={() => router.push('/admin/suscripcion')}>
          <Text>Ver mi plan</Text>
        </Button>
      ) : null}
    </View>
  );
}
