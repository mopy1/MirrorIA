import { View } from 'react-native';
import { PlataformaLogo } from '@/components/common/PlataformaLogo';
import { Titulo } from '@/components/common/Titulo';
import { Text } from '@/components/ui/text';

/** Cabecera de `/tiendas`, el único lugar con la identidad de MirrorIA. */
export function CabeceraPlataforma({ cantidad }: { cantidad?: number }) {
  return (
    <View className="pb-6 pt-4">
      <PlataformaLogo tamano={26} />
      <Titulo nivel="display" className="mt-8">
        ¿En qué tienda querés mirar hoy?
      </Titulo>
      <Text className="mt-3 text-sm leading-5 text-muted-foreground">
        Elegí una boutique: la app se viste con su marca y guarda su vitrina para verla sin internet.
        {cantidad ? ` ${cantidad} ${cantidad === 1 ? 'tienda abierta' : 'tiendas abiertas'}.` : ''}
      </Text>
    </View>
  );
}
