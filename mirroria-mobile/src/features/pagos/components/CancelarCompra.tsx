import { Alert } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

/** Acción destructiva secundaria (ghost) con confirmación nativa. Solo con red. */
export function CancelarCompra({ desdeReserva, deshabilitado, onConfirmar }: { desdeReserva: boolean; deshabilitado: boolean; onConfirmar: () => void }) {
  const preguntar = () =>
    Alert.alert(
      '¿Cancelar esta compra?',
      desdeReserva ? 'Tus prendas siguen reservadas: podés comprarlas después.' : 'Las prendas vuelven a tu carrito.',
      [
        { text: 'No, seguir', style: 'cancel' },
        { text: 'Sí, cancelar', style: 'destructive', onPress: onConfirmar },
      ],
    );
  return (
    <Button variant="ghost" disabled={deshabilitado} onPress={preguntar}>
      <Text className="text-danger">Cancelar compra</Text>
    </Button>
  );
}
