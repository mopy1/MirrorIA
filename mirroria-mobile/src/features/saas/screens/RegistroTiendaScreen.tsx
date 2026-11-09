import React from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { Cargando } from '@/components/admin/Estados';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { saasApi } from '../api/saasApi';
import { Aviso } from '../components/Aviso';
import { PlanOpcion } from '../components/PlanOpcion';
import { PasoCuenta } from '../components/registro/PasoCuenta';
import { Pasos } from '../components/registro/Pasos';
import { PasoTienda } from '../components/registro/PasoTienda';
import { useDisponibilidadSlug } from '../hooks/useDisponibilidadSlug';
import { useRecurso } from '../hooks/useRecurso';
import { useRegistroTienda } from '../hooks/useRegistroTienda';
import { PASOS_REGISTRO } from '../lib/registro';

/** `/saas/registro`: alta de una tienda nueva en 3 pasos (como `/registro-tienda` de la web). */
export function RegistroTiendaScreen() {
  const { plan: planParam } = useLocalSearchParams<{ plan?: string }>();
  const planes = useRecurso(saasApi.getPlanes, true, 'No se pudieron cargar los planes');
  const ciudades = useRecurso(saasApi.getCiudades, true, 'No se pudieron cargar las ciudades');
  const r = useRegistroTienda(planParam ?? 'crecimiento');
  const estadoSlug = useDisponibilidadSlug(r.form.tienda.slug);
  const plan = planes.data?.find((p) => p.codigo === r.form.planCodigo);
  const slugBloquea = r.paso === 1 && (estadoSlug.tipo === 'no-disponible' || estadoSlug.tipo === 'verificando');

  function siguiente() {
    if (slugBloquea) return;
    if (r.ultimo) void r.crear();
    else r.avanzar();
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <ScreenHeader title="Crear mi tienda" subtitle="Lista en 5 minutos" showLogo={false} showBack />
      <ScrollView contentContainerClassName="p-4 gap-5 pb-10" keyboardShouldPersistTaps="handled">
        <Pasos pasos={PASOS_REGISTRO} actual={r.paso} />
        <Text className="text-xl font-semibold text-foreground">{PASOS_REGISTRO[r.paso]}</Text>

        {r.paso === 0 && (
          <View role="radiogroup" className="gap-3">
            {planes.isLoading && <Cargando texto="Cargando planes…" />}
            {planes.error && <Aviso tono="error" texto={planes.error} accion={{ label: 'Reintentar', onPress: planes.reload }} />}
            {planes.data?.map((p) => (
              <PlanOpcion key={p.id} plan={p} activo={p.codigo === r.form.planCodigo} onPress={() => r.setPlan(p.codigo)} etiqueta={`${p.diasPrueba} días gratis`} />
            ))}
            {r.errores.planCodigo ? <Text className="text-xs text-destructive">{r.errores.planCodigo}</Text> : null}
          </View>
        )}
        {r.paso === 1 && (
          <>
            {ciudades.error && <Aviso tono="error" texto={ciudades.error} accion={{ label: 'Reintentar', onPress: ciudades.reload }} />}
            <PasoTienda r={r} estadoSlug={estadoSlug} ciudades={ciudades.data ?? []} />
          </>
        )}
        {r.paso === 2 && <PasoCuenta r={r} plan={plan} />}

        {r.error && <Aviso tono="error" texto={r.error} />}

        <View className="flex-row gap-3">
          <Button variant="outline" size="lg" className="flex-1" onPress={r.volver} disabled={r.paso === 0 || r.enviando}>
            <Text>Atrás</Text>
          </Button>
          <Button size="lg" className="flex-[2]" onPress={siguiente} disabled={r.enviando || slugBloquea}>
            <Text>{r.ultimo ? (r.enviando ? 'Creando tu tienda…' : 'Crear mi tienda') : 'Continuar'}</Text>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
