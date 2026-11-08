import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { PantallaAdmin } from '@/components/admin/PantallaAdmin';
import { Cargando, ErrorVista } from '@/components/admin/Estados';
import { Seccion } from '@/components/admin/Seccion';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/src/hooks/useAuth';
import { pasarelasApi } from '@/src/features/payments/api/pasarelasApi';
import { pasarelasDeSuscripcion } from '@/src/features/payments/lib/metodos-pago';
import { saasApi } from '../../saas/api/saasApi';
import { Aviso } from '../../saas/components/Aviso';
import { useRecurso } from '../../saas/hooks/useRecurso';
import { precioPlanBs, precioPlanUsd } from '../../saas/lib/limites';
import { suscripcionApi } from '../api/suscripcionApi';
import { CambiarPlanHoja } from '../components/CambiarPlanHoja';
import { CobroQrHoja } from '../components/CobroQrHoja';
import { PasarelasSuscripcion } from '../components/PasarelasSuscripcion';
import { PlanActualCard } from '../components/PlanActualCard';
import { Historial, IncluyeMarca, UsoPlan } from '../components/UsoEHistorial';
import { useCobroSuscripcion } from '../hooks/useCobroSuscripcion';
import { avisoDeRegreso, planACobrar } from '../lib/cobro';

/** `/admin/suscripcion` (solo ADMIN): plan, estado, vigencia, uso, historial, cambiar de plan y pagarlo. */
export function SuscripcionScreen() {
  const { user } = useAuth();
  const esAdmin = user?.role === 'ADMIN';
  const params = useLocalSearchParams<{ pago?: string; cobro?: string }>();
  const mi = useRecurso(suscripcionApi.getMiSuscripcion, esAdmin, 'No se pudo cargar tu suscripción');
  const planes = useRecurso(saasApi.getPlanes, esAdmin, 'No se pudieron cargar los planes');
  const pasarelas = useRecurso(() => pasarelasApi.getPasarelas('suscripcion'), esAdmin, 'No se pudieron cargar las formas de pago');
  const [planElegido, setPlanElegido] = useState<string | null>(null);
  const [hojaPlan, setHojaPlan] = useState(false);
  const recargar = mi.reload;
  const onPagado = useCallback(() => void recargar(), [recargar]);
  const cobro = useCobroSuscripcion(onPagado);
  const regresoUrl = useRef(false);

  // Regreso de Stripe/PayPal en la versión web (`?pago=exito&cobro=…`): se confirma con la API.
  useEffect(() => {
    if (regresoUrl.current || !esAdmin || params.pago !== 'exito' || !params.cobro) return;
    regresoUrl.current = true;
    void cobro.confirmar(params.cobro);
  }, [esAdmin, params.pago, params.cobro, cobro]);

  if (!esAdmin) {
    return (
      <PantallaAdmin titulo="Plan y suscripción">
        <Aviso tono="info" texto="Solo la dueña de la tienda (administradora) puede ver y pagar el plan." />
      </PantallaAdmin>
    );
  }

  const data = mi.data;
  const plan = data ? planACobrar(planes.data ?? [], planElegido, data.plan) : null;
  const aviso = cobro.regreso ? avisoDeRegreso(cobro.regreso.estado) : null;

  return (
    <PantallaAdmin titulo="Plan y suscripción" subtitulo="Tu plan, tu uso y hasta cuándo está vigente" recargando={mi.isLoading} onRecargar={mi.reload}>
      {aviso && cobro.regreso && (
        <Aviso
          tono={aviso.tono}
          texto={aviso.texto}
          accion={aviso.reintentable ? { label: cobro.regreso.estado === 'esperando' ? 'Ya pagué, revisar' : 'Revisar de nuevo', onPress: () => cobro.confirmar(cobro.regreso!.cobroId) } : undefined}
        />
      )}
      {params.pago === 'cancelado' && !cobro.regreso && <Aviso tono="info" texto="Cancelaste el pago en la pasarela. No se te cobró nada." />}

      {mi.isLoading && !data && <Cargando texto="Cargando tu suscripción…" />}
      {mi.error && !mi.isLoading && <ErrorVista mensaje={mi.error} onReintentar={mi.reload} />}

      {data && plan && (
        <>
          <PlanActualCard data={data}>
            <Button variant="outline" onPress={() => setHojaPlan(true)}>
              <Text>Cambiar plan</Text>
            </Button>
          </PlanActualCard>

          <Seccion titulo={data.suscripcion.estado === 'TRIAL' ? 'Activar plan' : 'Pagar o renovar'}>
            <View className="gap-1 rounded-xl bg-muted/50 p-3">
              <Text className="text-xs text-muted-foreground">Vas a pagar</Text>
              <Text className="text-lg font-bold text-foreground">Plan {plan.nombre}</Text>
              <Text className="text-sm text-foreground">
                {precioPlanBs(plan.precioMensualCents)} por mes <Text className="text-xs text-muted-foreground">({precioPlanUsd(plan.precioMensualUsdCents)} con PayPal)</Text>
              </Text>
              {planElegido && planElegido !== data.plan.codigo && (
                <Button size="sm" variant="ghost" className="self-start px-0" onPress={() => setPlanElegido(null)}>
                  <Text className="text-xs text-primary">Volver a mi plan actual ({data.plan.nombre})</Text>
                </Button>
              )}
            </View>
            <Text className="text-sm font-semibold text-foreground">Elegí cómo pagar</Text>
            {pasarelas.isLoading && <Cargando texto="Cargando formas de pago…" />}
            {pasarelas.error && <Aviso tono="error" texto={pasarelas.error} accion={{ label: 'Reintentar', onPress: pasarelas.reload }} />}
            {pasarelas.data && (
              <PasarelasSuscripcion pasarelas={pasarelasDeSuscripcion(pasarelas.data)} iniciando={cobro.iniciando} onElegir={(id) => cobro.iniciar(id, plan.codigo)} />
            )}
            {cobro.error && <Aviso tono="error" texto={cobro.error} />}
            <Text className="text-xs text-muted-foreground">El pago reactiva o extiende tu suscripción por 1 mes calendario.</Text>
          </Seccion>

          <IncluyeMarca nivel={data.plan.nivelMarca ?? 'ESENCIAL'} />
          <Seccion titulo="Uso del plan">
            <UsoPlan uso={data.uso} limites={data.plan.limites} />
          </Seccion>
          <Seccion titulo="Historial">
            <Historial historial={data.historial} />
          </Seccion>

          <CambiarPlanHoja
            key={String(hojaPlan)}
            visible={hojaPlan}
            onCerrar={() => setHojaPlan(false)}
            planes={planes.data ?? []}
            actual={data.plan.codigo}
            enPrueba={data.puedeCambiarPlan}
            onCambiado={(nuevo) => mi.setData(nuevo)}
            onElegirParaPagar={setPlanElegido}
          />
          <CobroQrHoja
            cobro={cobro.cobroQr}
            onCerrar={cobro.cerrarQr}
            onPagado={() => {
              cobro.cerrarQr();
              cobro.setRegreso({ cobroId: '', estado: 'pagado' });
              void mi.reload();
            }}
          />
        </>
      )}
    </PantallaAdmin>
  );
}
