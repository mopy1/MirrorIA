import { router } from 'expo-router';
import { Bell } from 'phosphor-react-native';
import * as React from 'react';
import { FlatList, View } from 'react-native';
import { EncabezadoPantalla } from '@/components/common/EncabezadoPantalla';
import { EstadoError } from '@/components/common/EstadoError';
import { EstadoVacio } from '@/components/common/EstadoVacio';
import { Pantalla } from '@/components/common/Pantalla';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import type { AvisoLocal } from '@/lib/db/repos/avisos.repo';
import { BannerPermiso } from '../components/BannerPermiso';
import { FilaAviso } from '../components/FilaAviso';
import { QuitarAviso } from '../components/QuitarAviso';
import { useAvisos, useMutacionesAviso } from '../hooks/use-avisos';
import { usePermisoNotificaciones } from '../hooks/use-permiso-notificaciones';

/** `mis-cosas/avisos`: "Avisame cuando vuelva" (SQLite `avisos_local`; se revisa tras cada sync del espejo). */
export default function AvisosScreen() {
  const q = useAvisos();
  const { quitar } = useMutacionesAviso();
  const permiso = usePermisoNotificaciones();
  const [aQuitar, setAQuitar] = React.useState<AvisoLocal | null>(null);
  const avisos = q.data ?? [];

  let cuerpo: React.ReactNode;
  if (q.isPending) cuerpo = <View className="gap-4 px-5 pt-2">{[0, 1].map((i) => <Skeleton key={i} style={{ height: 96 }} />)}</View>;
  else if (q.isError) cuerpo = <EstadoError error={q.error} onReintentar={() => void q.refetch()} />;
  else if (avisos.length === 0)
    cuerpo = (
      <View className="flex-1 justify-center pb-16">
        <EstadoVacio icono={Bell} titulo="No tenés avisos" texto="Si tu talla está agotada, tocá “Avisame cuando vuelva” en la ficha y te mandamos una notificación cuando la repongan.">
          <Button onPress={() => router.navigate('/vitrina')}>
            <Text>Ir a la vitrina</Text>
          </Button>
        </EstadoVacio>
      </View>
    );
  else
    cuerpo = (
      <FlatList
        data={avisos}
        keyExtractor={(a) => a.id}
        contentContainerClassName="px-5 pb-10"
        ListHeaderComponent={<Text className="pb-1 text-xs leading-4 text-muted-foreground">Revisamos el stock cada vez que se actualiza la vitrina (al abrir la app con red y cada 5 min). Tocá una prenda para verla.</Text>}
        renderItem={({ item }) => <FilaAviso aviso={item} onQuitar={() => setAQuitar(item)} />}
      />
    );

  return (
    <Pantalla>
      <EncabezadoPantalla titulo="Avisos" respaldo="/mis-cosas" />
      {!permiso.cargando && !permiso.concedido ? <BannerPermiso onActivar={() => void permiso.pedir()} /> : null}
      {cuerpo}
      <QuitarAviso
        prenda={aQuitar?.prenda ?? null}
        abierto={!!aQuitar}
        onCerrar={() => setAQuitar(null)}
        onConfirmar={() => {
          if (aQuitar) quitar.mutate(aQuitar.id);
          setAQuitar(null);
        }}
      />
    </Pantalla>
  );
}
