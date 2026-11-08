import { Camera, CloudSlash, Sparkle, Timer, WarningCircle } from 'phosphor-react-native';
import { Linking, View } from 'react-native';
import { Titulo } from '@/components/common/Titulo';
import { Button } from '@/components/ui/button';
import { Icon, type PhosphorIcon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { FaseProbador } from '@/lib/probador/fase-probador';

interface Props {
  fase: FaseProbador;
  error: string | null;
  hayPrendas: boolean;
  onEncender: () => void;
  onPermiso: () => void;
  onReintentar: () => void;
}

type Contenido = { icono: PhosphorIcon; titulo: string; texto: string; accion?: string; onPress?: () => void };

/** Lo que se ve cuando NO hay video en vivo: un mensaje claro y una sola acción primaria. */
export function PanelEstadoProbador({ fase, error, hayPrendas, onEncender, onPermiso, onReintentar }: Props) {
  const c: Contenido | null = (() => {
    switch (fase) {
      case 'sin-red':
        return { icono: CloudSlash, titulo: 'Probador no disponible sin red', texto: 'La IA arma el video en vivo en internet. Cuando vuelva la conexión lo podés encender.' };
      case 'inicio':
        return hayPrendas
          ? { icono: Sparkle, titulo: 'Probador con IA', texto: 'Elegí una prenda de abajo y mirate en vivo con ella puesta, usando la cámara frontal. Nada se graba.', accion: 'Encender el probador', onPress: onEncender }
          : { icono: Sparkle, titulo: 'Todavía no hay prendas para probar', texto: 'Abrí la vitrina con internet para bajar las prendas con foto.' };
      case 'tiempo-cumplido':
        return { icono: Timer, titulo: 'Se terminó la sesión', texto: 'Cada sesión dura un minuto para que la IA esté libre para todas.', accion: 'Seguir probando', onPress: onEncender };
      case 'permiso':
        return { icono: Camera, titulo: 'Permitir la cámara', texto: 'La usamos solo para mostrarte con la prenda puesta. No sacamos fotos ni guardamos nada.', accion: 'Permitir cámara', onPress: onPermiso };
      case 'permiso-negado':
        return { icono: Camera, titulo: 'La cámara está bloqueada', texto: 'Para usar el probador activá el permiso de cámara de MirrorIA.', accion: 'Abrir ajustes', onPress: () => void Linking.openSettings() };
      case 'error':
        return { icono: WarningCircle, titulo: 'No se pudo encender', texto: error ?? 'No pudimos abrir la cámara.', accion: 'Reintentar', onPress: onReintentar };
      default:
        return null;
    }
  })();
  if (!c) return null;
  return (
    <View className="absolute inset-x-0 bottom-0 px-6 pb-6">
      <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-white/15">
        <Icon as={c.icono} size={26} weight="duotone" className="text-white" />
      </View>
      <Titulo nivel="display" className="text-white">
        {c.titulo}
      </Titulo>
      <Text className="mt-2 text-sm leading-5 text-white/85">{c.texto}</Text>
      {c.accion ? (
        <Button size="lg" className="mt-5 h-[52px]" onPress={c.onPress}>
          <Text>{c.accion}</Text>
        </Button>
      ) : null}
    </View>
  );
}
