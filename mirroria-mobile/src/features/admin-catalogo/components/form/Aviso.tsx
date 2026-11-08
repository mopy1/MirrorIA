import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/src/hooks/useAuth';
import { esErrorDeLimite } from '../../lib/texto';

/**
 * Muestra el `message` del backend tal cual. Si es el 409 de límite del plan
 * (siempre nombra al plan), suma "Ver mi plan" para la dueña, igual que la web.
 */
export function AvisoError({ mensaje }: { mensaje: string | null | undefined }) {
  const { user } = useAuth();
  const router = useRouter();
  if (!mensaje) return null;
  const verPlan = esErrorDeLimite(mensaje) && user?.role === 'ADMIN';
  return (
    <View className="gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3">
      <View className="flex-row gap-2">
        <Icon as={AlertCircle} size={18} className="text-destructive" />
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

export function AvisoExito({ mensaje }: { mensaje: string | null | undefined }) {
  if (!mensaje) return null;
  return (
    <View className="flex-row gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
      <Icon as={CheckCircle2} size={18} className="text-emerald-600" />
      <Text className="flex-1 text-sm text-emerald-700">{mensaje}</Text>
    </View>
  );
}
