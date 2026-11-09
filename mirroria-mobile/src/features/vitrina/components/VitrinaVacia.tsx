import { router } from 'expo-router';
import { CloudSlash, CoatHanger } from 'phosphor-react-native';
import { EstadoVacio } from '@/components/common/EstadoVacio';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

/** V: tienda sin prendas · CU46 4b: nunca se sincronizó y no hay red. */
export function VitrinaVacia({ nuncaSincronizada, onReintentar }: { nuncaSincronizada: boolean; onReintentar: () => void }) {
  if (nuncaSincronizada) {
    return (
      <EstadoVacio icono={CloudSlash} tono="aviso" titulo="Todavía no guardamos esta vitrina" texto="Conectate una vez para descargarla; después la podés ver sin internet durante 7 días.">
        <Button onPress={onReintentar}>
          <Text>Reintentar</Text>
        </Button>
      </EstadoVacio>
    );
  }
  return (
    <EstadoVacio icono={CoatHanger} titulo="Esta tienda aún no publicó prendas" texto="Volvé pronto o mirá otra boutique mientras tanto.">
      <Button onPress={() => router.push('/tiendas')}>
        <Text>Cambiar de tienda</Text>
      </Button>
    </EstadoVacio>
  );
}
