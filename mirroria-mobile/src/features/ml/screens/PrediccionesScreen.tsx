import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { HelpCircle, Info } from 'lucide-react-native';
import { Vacio } from '@/components/admin/Estados';
import { PantallaAdmin } from '@/components/admin/PantallaAdmin';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { SelectorChips } from '@/src/features/dashboard/components/comun/SelectorChips';
import { SelectorSucursal } from '@/src/features/dashboard/components/comun/SelectorSucursal';
import { useAuth } from '@/src/hooks/useAuth';
import { FichaTecnicaModal } from '../components/FichaTecnicaModal';
import { SeccionCitas } from '../components/SeccionCitas';
import { SeccionClientas } from '../components/SeccionClientas';
import { SeccionReponer } from '../components/SeccionReponer';
import { SeccionVentas } from '../components/SeccionVentas';
import { VistaResumenMl } from '../components/VistaResumenMl';
import { usePrediccionesMl } from '../hooks/usePrediccionesMl';
import { puedeVerPredicciones } from '../lib/ml-consultas';
import { HORIZONTES, TABS_PREDICCION, type TabPrediccion } from '../lib/ml-tabs';

const OPC_HORIZONTE = HORIZONTES.map((h) => ({ id: String(h), label: `${h} días` }));

/** /admin/ml: Predicciones en lenguaje de negocio; lo técnico vive en "¿Cómo se calcula?". */
function Predicciones() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabPrediccion>('resumen');
  const [dias, setDias] = useState(30);
  const [sucursalId, setSucursalId] = useState<string | undefined>();
  const [ficha, setFicha] = useState(false);
  const p = usePrediccionesMl({ dias, sucursalId, rol: user?.role });
  const { demanda, noShow, rfm, anomalias, metricas, nombres, permitidas } = p;

  return (
    <PantallaAdmin
      titulo="Predicciones"
      subtitulo="Lo que probablemente pase y qué conviene hacer"
      recargando={p.cargando && !!demanda.data}
      onRecargar={p.recargarTodo}
      accion={
        <Pressable onPress={() => setFicha(true)} hitSlop={8} accessibilityLabel="¿Cómo se calcula?" className="flex-row items-center gap-1">
          <Icon as={HelpCircle} size={18} className="text-primary" />
          <Text className="text-xs font-semibold text-primary">¿Cómo se calcula?</Text>
        </Pressable>
      }>
      {p.esEstimacion ? (
        <View className="flex-row items-start gap-2 rounded-xl bg-sky-500/10 p-3">
          <Icon as={Info} size={16} className="mt-0.5 text-sky-600" />
          <Text className="flex-1 text-sm">
            Mostrando una estimación aproximada: el servicio de predicción no respondió.{' '}
            <Text className="text-sm font-semibold text-primary" onPress={p.recargarTodo}>
              Volver a intentar
            </Text>
          </Text>
        </View>
      ) : null}

      <SelectorChips etiqueta="Sección" opciones={TABS_PREDICCION.map((t) => ({ id: t.id, label: t.etiqueta }))} valor={tab} onCambiar={setTab} />
      <View className="gap-2">
        <Text className="text-xs text-muted-foreground">Proyectar los próximos</Text>
        <SelectorChips etiqueta="Proyectar a" opciones={OPC_HORIZONTE} valor={String(dias)} onCambiar={(v) => setDias(Number(v))} />
        <SelectorSucursal sucursalId={sucursalId} onCambiar={setSucursalId} />
      </View>

      {tab === 'resumen' ? <VistaResumenMl p={p} onIrA={setTab} /> : null}
      {tab === 'demanda' ? (
        <SeccionReponer data={demanda.data} nombres={nombres} isLoading={demanda.isLoading} error={demanda.error} onReintentar={() => void demanda.reload()} />
      ) : null}
      {tab === 'noshow' ? (
        <SeccionCitas data={noShow.data} isLoading={noShow.isLoading} error={noShow.error} onReintentar={() => void noShow.reload()} />
      ) : null}
      {tab === 'rfm' ? (
        <SeccionClientas data={rfm.data} isLoading={rfm.isLoading} error={rfm.error} onReintentar={() => void rfm.reload()} soloDuena={!permitidas.rfm} />
      ) : null}
      {tab === 'auditoria' ? (
        <SeccionVentas data={anomalias.data} isLoading={anomalias.isLoading} error={anomalias.error} onReintentar={() => void anomalias.reload()} soloDuena={!permitidas.anomalias} />
      ) : null}

      <FichaTecnicaModal
        abierto={ficha}
        onCerrar={() => setFicha(false)}
        metricas={metricas.data}
        cargandoMetricas={metricas.isLoading}
        datos={{ demanda: demanda.data, noShow: noShow.data, rfm: rfm.data, anomalias: anomalias.data }}
        esEstimacion={p.esEstimacion}
      />
    </PantallaAdmin>
  );
}

/** La cajera no entra a Predicciones (igual que el menú de la web): aviso y ninguna llamada a la API. */
export function PrediccionesScreen() {
  const { user } = useAuth();
  if (!puedeVerPredicciones(user?.role)) {
    return (
      <PantallaAdmin titulo="Predicciones">
        <Vacio titulo="Esta pantalla es para la dueña y la encargada" detalle="Pedile a la encargada que revise las predicciones de la tienda." />
      </PantallaAdmin>
    );
  }
  return <Predicciones />;
}
