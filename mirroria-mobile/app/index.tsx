import { Redirect } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';
import { esEquipo } from '@/src/features/auth/lib/destino';

export default function Index() {
  const { user } = useAuth();
  return <Redirect href={esEquipo(user?.role) ? '/admin' : '/(tabs)'} />;
}
