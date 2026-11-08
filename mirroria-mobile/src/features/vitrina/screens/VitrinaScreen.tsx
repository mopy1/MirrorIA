import { useQueryClient } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarraRed } from '@/components/common/BarraRed';
import { EstadoError } from '@/components/common/EstadoError';
import { useTema } from '@/contexts/TemaContext';
import { useTienda } from '@/contexts/TiendaContext';
import { CLAVE_SYNC, useSincronizacionEspejo } from '@/features/espejo/hooks/use-sincronizacion-espejo';
import { useEstadoRed } from '@/lib/red/use-estado-red';
import { AvisoEspejo } from '../components/AvisoEspejo';
import { ChipsCategoria } from '../components/ChipsCategoria';
import { GrillaPrendas } from '../components/GrillaPrendas';
import { HeroVitrina } from '../components/HeroVitrina';
import { PieVitrina } from '../components/PieVitrina';
import { VitrinaSkeleton } from '../components/VitrinaSkeleton';
import { VitrinaVacia } from '../components/VitrinaVacia';
import { useBarraEstadoVitrina } from '../hooks/use-barra-estado-vitrina';
import { useVitrina } from '../hooks/use-vitrina';

/** `vitrina/index`: catálogo desde el espejo SQLite (offline 7 días) con la portada de la marca. */
export default function VitrinaScreen() {
  const { tienda } = useTienda();
  const red = useEstadoRed();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const q = useVitrina();
  const sync = useSincronizacionEspejo();
  const [categoria, setCategoria] = React.useState<string | null>(null);
  const barra = useBarraEstadoVitrina(380);
  const enfocada = useIsFocused();
  const { tema } = useTema();
  if (!tienda) return null;

  const prendas = q.data?.prendas ?? [];
  const categorias = [...new Set(prendas.map((p) => p.categoria).filter((c): c is string => !!c))].sort();
  const visibles = categoria ? prendas.filter((p) => p.categoria === categoria) : prendas;
  const nunca = q.data?.estado.ultimoSync == null;
  const cargando = q.isPending || (nunca && sync.isFetching);
  const refrescar = () => void qc.refetchQueries({ queryKey: CLAVE_SYNC });

  return (
    <View className="flex-1 bg-background">
      {enfocada ? <StatusBar style={barra.pasado || !red.online ? (tema.oscuro ? 'light' : 'dark') : 'light'} /> : null}
      {!red.online ? (
        <View style={{ paddingTop: insets.top }} className="bg-background">
          <BarraRed />
        </View>
      ) : null}
      <ScrollView onScroll={barra.onScroll} scrollEventThrottle={32} refreshControl={<RefreshControl refreshing={sync.isRefetching} onRefresh={refrescar} progressViewOffset={insets.top} />}>
        <HeroVitrina tienda={tienda} insetSuperior={red.online ? insets.top : 0} />
        {q.isError ? (
          <EstadoError error={q.error} onReintentar={() => void q.refetch()} />
        ) : cargando ? (
          <VitrinaSkeleton />
        ) : prendas.length === 0 ? (
          <VitrinaVacia nuncaSincronizada={nunca} onReintentar={refrescar} />
        ) : (
          <>
            <AvisoEspejo ultimoSync={q.data!.estado.ultimoSync} vencido={q.data!.vencido} />
            {categorias.length > 1 ? <ChipsCategoria categorias={categorias} activa={categoria} onCambiar={setCategoria} /> : <View className="h-5" />}
            <GrillaPrendas prendas={visibles} />
            <PieVitrina ultimoSync={q.data!.estado.ultimoSync} prendas={prendas.length} sincronizando={sync.isFetching} />
          </>
        )}
      </ScrollView>
      {barra.pasado && red.online ? <View className="absolute left-0 right-0 top-0 border-b border-border bg-background" style={{ height: insets.top }} /> : null}
    </View>
  );
}
