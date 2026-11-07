import { router } from 'expo-router';
import { CheckCircle, Sparkle } from 'phosphor-react-native';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useTema } from '@/contexts/TemaContext';
import { mensajeDeError } from '@/lib/api/errores';
import { formatoBs } from '@/lib/formato/dinero';

interface Props {
  precioCents: number;
  agotada: boolean;
  online: boolean;
  agregando: boolean;
  agregada: boolean;
  error: unknown;
  onAgregar: () => void;
  onReservar: () => void;
  onAvisame: () => void;
}

/** Barra de acciones pegada abajo (zona del pulgar): 1 primaria con el monto adentro. */
export function AccionesFicha(p: Props) {
  const insets = useSafeAreaInsets();
  const { colores } = useTema();
  const sinRed = !p.online && !p.agotada;
  return (
    <View className="border-t border-border bg-background px-5 pt-3" style={{ paddingBottom: insets.bottom + 10 }}>
      {p.agregada ? (
        <Pressable onPress={() => router.navigate('/carrito')} className="mb-2 flex-row items-center gap-2" accessibilityRole="link">
          <Icon as={CheckCircle} size={18} weight="fill" className="text-success" />
          <Text className="flex-1 text-sm">Agregada a tu carrito</Text>
          <Text className="font-body-semibold text-sm text-primary">Ver carrito</Text>
        </Pressable>
      ) : null}
      {p.error ? <Text className="mb-2 text-sm text-danger">{mensajeDeError(p.error)}</Text> : null}
      {sinRed ? <Text className="mb-2 text-xs text-muted-foreground">Sin conexión: para agregar al carrito necesitás red en esta versión.</Text> : null}
      <Button size="lg" className="h-[52px]" disabled={p.agregando || sinRed} onPress={p.agotada ? p.onAvisame : p.onAgregar}>
        {p.agregando ? <ActivityIndicator color={colores['primary-foreground']} /> : null}
        <Text>{p.agotada ? 'Avisame cuando vuelva' : `Agregar al carrito · ${formatoBs(p.precioCents)}`}</Text>
      </Button>
      <View className="mt-2 flex-row gap-2">
        <Button variant="outline" className="h-11 flex-1" onPress={p.onReservar}>
          <Text>Reservar para probarme</Text>
        </Button>
        <Button variant="ghost" className="h-11" onPress={() => router.navigate('/probador')}>
          <Icon as={Sparkle} size={16} weight="fill" className="text-primary" />
          <Text>Probar con IA</Text>
        </Button>
      </View>
    </View>
  );
}
