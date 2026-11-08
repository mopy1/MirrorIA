import { WarningOctagon } from 'phosphor-react-native';
import { ActivityIndicator, Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Titulo } from '@/components/common/Titulo';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useTema } from '@/contexts/TemaContext';
import { mensajeDeError } from '@/lib/api/errores';
import { conflictosStore } from '@/lib/outbox/conflictos-store';
import { useConflictoActual } from '@/lib/outbox/use-outbox';
import { useEstadoRed } from '@/lib/red/use-estado-red';
import { useResolverConflicto } from '../hooks/use-resolver-conflicto';
import { AlternativasConflicto } from './AlternativasConflicto';

/**
 * Frontera ICONIX `ModalConflictoStock` (CU11): la compra encolada chocó al sincronizar
 * (409 STOCK_AGOTADO_CONFLICTO) y quedó COMPENSADA. Hoja inferior global (vive en el layout raíz).
 */
export function ModalConflictoStock() {
  const c = useConflictoActual();
  const insets = useSafeAreaInsets();
  const { colores } = useTema();
  const red = useEstadoRed();
  const { retirarEn, cambiarTalla } = useResolverConflicto(c);
  const d = c?.detalle ?? {};
  const otra = d.alternativas?.otrasSucursales?.[0];
  const talla = d.alternativas?.otrasTallas?.[0];
  const prenda = [d.prendaNombre ?? 'prenda', d.talla && `talla ${d.talla}`].filter(Boolean).join(' ');
  const ocupado = retirarEn.isPending || cambiarTalla.isPending;
  const error = retirarEn.error ?? cambiarTalla.error;

  return (
    <Modal visible={!!c} transparent animationType="slide" onRequestClose={conflictosStore.cerrar} statusBarTranslucent>
      <Pressable className="flex-1 bg-black/50" onPress={conflictosStore.cerrar} accessibilityLabel="Cerrar" />
      <View className="max-h-[85%] rounded-t-3xl bg-card px-6 pt-3" style={{ paddingBottom: insets.bottom + 16 }}>
        <View className="mb-5 h-1 w-10 self-center rounded-full bg-border" />
        <ScrollView contentContainerClassName="gap-5 pb-2">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-danger/10">
            <Icon as={WarningOctagon} size={26} weight="duotone" className="text-danger" />
          </View>
          <View className="gap-2">
            <Titulo nivel="h2">Se agotó mientras estabas sin conexión</Titulo>
            <Text className="text-sm leading-5 text-muted-foreground">
              Otra clienta compró la última {prenda}
              {d.sucursalNombre ? ` en ${d.sucursalNombre}` : ''} antes de que llegara tu pedido. Tu compra se anuló y{' '}
              <Text className="font-body-semibold text-sm text-foreground">no se te cobró nada</Text>; las prendas siguen en tu carrito.
            </Text>
          </View>
          <AlternativasConflicto detalle={d} />
          {error ? <Text className="text-sm text-danger">{mensajeDeError(error)}</Text> : null}
        </ScrollView>
        <View className="mt-4 gap-2">
          {otra && c?.fila.tipo === 'CHECKOUT' ? (
            <Button size="lg" className="h-[52px]" disabled={ocupado} onPress={() => retirarEn.mutate(otra)}>
              {retirarEn.isPending ? <ActivityIndicator color={colores['primary-foreground']} /> : null}
              <Text>Retirar en {otra.sucursalNombre ?? 'otra sucursal'}</Text>
            </Button>
          ) : (
            <Button size="lg" className="h-[52px]" onPress={conflictosStore.cerrar}>
              <Text>Entendido</Text>
            </Button>
          )}
          {talla ? (
            <Button variant="outline" size="lg" disabled={ocupado || !red.online} onPress={() => cambiarTalla.mutate(talla)}>
              <Text>{red.online ? `Cambiar a talla ${talla.talla ?? ''}` : 'Cambiar talla (necesita red)'}</Text>
            </Button>
          ) : null}
          {otra ? (
            <Button variant="ghost" onPress={conflictosStore.cerrar}>
              <Text>Cerrar</Text>
            </Button>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
