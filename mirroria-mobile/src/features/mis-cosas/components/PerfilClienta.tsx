import { View } from 'react-native';
import { Titulo } from '@/components/common/Titulo';
import { Text } from '@/components/ui/text';
import type { UsuarioSesion } from '@/lib/sesion/sesion-store';

/** Saludo de la clienta: inicial en el color de la marca, nombre y correo. */
export function PerfilClienta({ usuario, tienda }: { usuario: UsuarioSesion; tienda: string }) {
  const inicial = usuario.fullName.trim()[0]?.toUpperCase() ?? '·';
  return (
    <View className="flex-row items-center gap-4 px-5 pb-6 pt-4">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-primary">
        <Text className="font-body-semibold text-xl text-primary-foreground">{inicial}</Text>
      </View>
      <View className="flex-1">
        <Titulo nivel="h1" numberOfLines={1}>
          Hola, {usuario.fullName.split(' ')[0]}
        </Titulo>
        <Text className="text-sm text-muted-foreground" numberOfLines={1}>
          {usuario.email} · {tienda}
        </Text>
      </View>
    </View>
  );
}
