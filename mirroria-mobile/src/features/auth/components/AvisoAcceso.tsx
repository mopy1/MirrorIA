import { Briefcase, WarningCircle } from 'phosphor-react-native';
import { View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ErrorCuentaPersonal } from '../types/auth.types';
import { mensajeAcceso } from '../hooks/use-acceso';

/** Error del login/registro. La cuenta de personal (D2) se explica distinto: no es un error de la clienta. */
export function AvisoAcceso({ error }: { error: unknown }) {
  if (!error) return null;
  const personal = error instanceof ErrorCuentaPersonal;
  return (
    <View className={personal ? 'flex-row gap-3 rounded-lg bg-info/10 p-4' : 'flex-row gap-3 rounded-lg bg-danger/10 p-4'} accessibilityLiveRegion="polite">
      <Icon as={personal ? Briefcase : WarningCircle} size={20} weight="duotone" className={personal ? 'text-info' : 'text-danger'} />
      <View className="flex-1 gap-1">
        {personal ? <Text className="font-body-semibold text-sm">Esta app es para clientas</Text> : null}
        <Text className="text-sm leading-5">{mensajeAcceso(error)}</Text>
      </View>
    </View>
  );
}
