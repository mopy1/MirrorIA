import { useQueryClient } from '@tanstack/react-query';
import { ArrowsClockwise, DeviceMobile } from 'phosphor-react-native';
import { ActivityIndicator, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useTema } from '@/contexts/TemaContext';
import { CLAVE_SYNC, useSincronizacionEspejo } from '@/features/espejo/hooks/use-sincronizacion-espejo';
import { useVitrina } from '@/features/vitrina/hooks/use-vitrina';
import { haceCuanto } from '@/lib/formato/fechas';
import { useEstadoRed } from '@/lib/red/use-estado-red';

/** Estado del espejo SQLite: cuántas prendas hay en el teléfono y cuándo se guardó. */
export function TarjetaEspejo() {
  const { colores } = useTema();
  const red = useEstadoRed();
  const qc = useQueryClient();
  const v = useVitrina();
  const sync = useSincronizacionEspejo();
  const e = v.data?.estado;
  return (
    <View className="mx-5 mb-4 flex-row items-center gap-3 rounded-lg border border-border p-4">
      <Icon as={DeviceMobile} size={24} weight="duotone" className="text-primary" />
      <View className="flex-1">
        <Text className="font-body-semibold text-sm">Vitrina guardada en el teléfono</Text>
        <Text className="text-xs text-muted-foreground">
          {e?.ultimoSync ? `${e.prendas} prendas · ${haceCuanto(e.ultimoSync)}` : 'Todavía sin descargar'}
        </Text>
      </View>
      <Button size="icon" variant="ghost" disabled={!red.online || sync.isFetching} onPress={() => void qc.refetchQueries({ queryKey: CLAVE_SYNC })} accessibilityLabel="Actualizar vitrina">
        {sync.isFetching ? <ActivityIndicator color={colores.primary} /> : <Icon as={ArrowsClockwise} size={20} className="text-foreground" />}
      </Button>
    </View>
  );
}
