import { router } from 'expo-router';
import { Tag, WarningCircle } from 'phosphor-react-native';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { haceCuanto } from '@/lib/formato/fechas';
import type { EstadoEscaneo } from '../../hooks/use-escaner';

interface Props {
  estado: Exclude<EstadoEscaneo, { tipo: 'leyendo' }>;
  tienda: string;
  ultimoSync: number | null;
  online: boolean;
  onOtraVez: () => void;
}

/** "No encontrado" útil: qué se leyó, por qué puede pasar y qué hacer (escanear otra o ir a la vitrina). */
export function ResultadoEscaneo({ estado, tienda, ultimoSync, online, onOtraVez }: Props) {
  const noEsta = estado.tipo === 'no-encontrado';
  const actualizar = online ? 'Actualizá la vitrina (deslizá hacia abajo) y probá de nuevo.' : 'Sin red no podemos traer lo nuevo.';
  const pista = noEsta
    ? `Puede ser de otra tienda o una prenda recién cargada. ${actualizar}${ultimoSync ? ` Vitrina actualizada ${haceCuanto(ultimoSync)}.` : ''}`
    : 'Este código no es una etiqueta de prenda (el Pase de Tienda se muestra en la caja, no se escanea).';
  return (
    <View className="mx-5 gap-3 rounded-xl border border-warning/40 bg-card p-4">
      <View className="flex-row items-center gap-2">
        <Icon as={noEsta ? Tag : WarningCircle} size={20} weight="duotone" className="text-warning" />
        <Text className="flex-1 font-body-semibold text-[15px]">{noEsta ? `Esta prenda no está en la vitrina de ${tienda}` : 'No reconocimos el código'}</Text>
      </View>
      <Text className="font-mono text-sm text-muted-foreground" numberOfLines={1}>
        {noEsta ? estado.codigo : estado.leido}
      </Text>
      <Text className="text-xs leading-4 text-muted-foreground">{pista}</Text>
      <View className="flex-row gap-2">
        <Button className="h-11 flex-1" onPress={onOtraVez}>
          <Text>Escanear otra</Text>
        </Button>
        <Button variant="outline" className="h-11" onPress={() => router.navigate('/vitrina')}>
          <Text>Ver la vitrina</Text>
        </Button>
      </View>
    </View>
  );
}
