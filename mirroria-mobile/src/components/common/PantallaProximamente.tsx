import { router, type Href } from 'expo-router';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { type PhosphorIcon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { EncabezadoPantalla } from './EncabezadoPantalla';
import { EstadoVacio } from './EstadoVacio';
import { Pantalla } from './Pantalla';

interface Props {
  encabezado: string;
  icono: PhosphorIcon;
  titulo: string;
  texto: string;
  accion: { texto: string; href: Href };
  respaldo: Href;
}

/** Pantalla de una fase futura: navegable, con "← Volver", qué va a hacer y una salida útil. */
export function PantallaProximamente({ encabezado, icono, titulo, texto, accion, respaldo }: Props) {
  return (
    <Pantalla>
      <EncabezadoPantalla titulo={encabezado} respaldo={respaldo} />
      <View className="flex-1 justify-center pb-16">
        <EstadoVacio icono={icono} titulo={titulo} texto={texto}>
          <View className="mb-2 self-center rounded-full bg-brand-accent px-3 py-1">
            <Text className="font-body-semibold text-xs text-brand-accent-foreground">Próximamente</Text>
          </View>
          <Button onPress={() => router.navigate(accion.href)}>
            <Text>{accion.texto}</Text>
          </Button>
        </EstadoVacio>
      </View>
    </Pantalla>
  );
}
