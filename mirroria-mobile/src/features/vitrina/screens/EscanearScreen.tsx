import { useCameraPermissions } from 'expo-camera';
import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { Keyboard as IconoTeclado, Scan } from 'phosphor-react-native';
import * as React from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { EncabezadoPantalla } from '@/components/common/EncabezadoPantalla';
import { EstadoVacio } from '@/components/common/EstadoVacio';
import { Pantalla } from '@/components/common/Pantalla';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useTienda } from '@/contexts/TiendaContext';
import { useEstadoRed } from '@/lib/red/use-estado-red';
import { CodigoManual } from '../components/escaner/CodigoManual';
import { PermisoCamara } from '../components/escaner/PermisoCamara';
import { ResultadoEscaneo } from '../components/escaner/ResultadoEscaneo';
import { VisorEtiqueta } from '../components/escaner/VisorEtiqueta';
import { useEscaner } from '../hooks/use-escaner';

/**
 * `vitrina/escanear` (D10): la clienta, en la tienda física, escanea la etiqueta de una prenda
 * y abre su ficha con la talla y el color de esa etiqueta. Busca en SQLite: funciona sin red.
 * `?codigo=` (deep link) hace lo mismo que leerlo con la cámara.
 */
export default function EscanearScreen() {
  const { codigo } = useLocalSearchParams<{ codigo?: string }>();
  const { tienda } = useTienda();
  const red = useEstadoRed();
  const enfocada = useIsFocused();
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [manual, setManual] = React.useState(false);
  const e = useEscaner();
  const { leer } = e;

  React.useEffect(() => {
    if (codigo && tienda) void leer(codigo, true);
  }, [codigo, tienda, leer]);

  let cuerpo: React.ReactNode;
  if (e.espejoVacio)
    cuerpo = (
      <EstadoVacio icono={Scan} titulo="Primero abrí la vitrina con internet" texto="El escáner busca en las prendas guardadas en tu teléfono, y todavía no bajamos ninguna.">
        <Button onPress={() => router.navigate('/vitrina')}>
          <Text>Ir a la vitrina</Text>
        </Button>
      </EstadoVacio>
    );
  else if (!permiso) cuerpo = <View className="flex-1" />;
  else if (!permiso.granted && !manual)
    cuerpo = <PermisoCamara puedePreguntar={permiso.canAskAgain} onPedir={() => void pedirPermiso()} onEscribir={() => setManual(true)} />;
  else
    cuerpo = (
      <View className="flex-1 gap-4 pb-4">
        {permiso.granted ? <VisorEtiqueta activo={enfocada} pausado={e.estado.tipo !== 'leyendo'} onLeer={(t) => void leer(t)} /> : <View className="flex-1" />}
        {e.estado.tipo !== 'leyendo' ? (
          <ResultadoEscaneo estado={e.estado} tienda={tienda?.nombre ?? 'esta tienda'} ultimoSync={e.ultimoSync} online={red.online} onOtraVez={e.otraVez} />
        ) : manual ? (
          <CodigoManual onBuscar={(c) => void leer(c)} />
        ) : (
          <View className="flex-row items-center gap-3 px-5">
            <Text className="flex-1 text-xs leading-4 text-muted-foreground">Abrimos la ficha con la talla y el color de la etiqueta. Funciona sin internet.</Text>
            <Button variant="outline" className="h-11" onPress={() => setManual(true)}>
              <Icon as={IconoTeclado} size={18} />
              <Text>Escribir código</Text>
            </Button>
          </View>
        )}
      </View>
    );

  return (
    <Pantalla>
      <EncabezadoPantalla titulo="Escanear etiqueta" respaldo="/vitrina" />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {cuerpo}
      </KeyboardAvoidingView>
    </Pantalla>
  );
}
