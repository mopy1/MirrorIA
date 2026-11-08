import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ApiError } from '@/src/lib/api';
import { Aviso } from '../../saas/components/Aviso';
import { HojaInferior } from '../../saas/components/HojaInferior';
import { PlanOpcion } from '../../saas/components/PlanOpcion';
import type { PlanDto } from '../../saas/types/saas.types';
import { suscripcionApi } from '../api/suscripcionApi';
import type { MiSuscripcionDto } from '../types/suscripcion.types';

interface Props {
  visible: boolean;
  onCerrar: () => void;
  planes: PlanDto[];
  actual: string;
  /** En la prueba el cambio es gratis (PATCH); después se elige el plan y se paga. */
  enPrueba: boolean;
  onCambiado: (nuevo: MiSuscripcionDto) => void;
  onElegirParaPagar: (codigo: string) => void;
}

/** Cambio de plan. El 409 del backend (uso por encima de los topes del plan nuevo) se muestra tal cual. */
export function CambiarPlanHoja({ visible, onCerrar, planes, actual, enPrueba, onCambiado, onElegirParaPagar }: Props) {
  const [elegido, setElegido] = useState(actual);
  const [cambiando, setCambiando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmar() {
    if (!enPrueba) {
      onElegirParaPagar(elegido);
      onCerrar();
      return;
    }
    setCambiando(true);
    setError(null);
    try {
      onCambiado(await suscripcionApi.cambiarPlan(elegido));
      onCerrar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cambiar el plan');
    } finally {
      setCambiando(false);
    }
  }

  return (
    <HojaInferior
      visible={visible}
      onCerrar={onCerrar}
      titulo="Cambiar de plan"
      descripcion={
        enPrueba
          ? 'Durante la prueba gratis podés cambiar de plan las veces que quieras.'
          : 'El plan nuevo se activa al pagarlo y suma un mes a tu vigencia.'
      }
      pie={
        <>
          <Button variant="outline" className="flex-1" onPress={onCerrar}>
            <Text>Cancelar</Text>
          </Button>
          <Button className="flex-1" onPress={confirmar} disabled={cambiando || (enPrueba && elegido === actual)}>
            <Text>{cambiando ? 'Cambiando…' : enPrueba ? 'Confirmar cambio' : 'Elegir y pagar'}</Text>
          </Button>
        </>
      }
    >
      {planes.map((p) => (
        <PlanOpcion key={p.id} plan={p} activo={p.codigo === elegido} onPress={() => setElegido(p.codigo)} etiqueta={p.codigo === actual ? '(actual)' : undefined} />
      ))}
      {error && <Aviso tono="error" texto={error} />}
    </HojaInferior>
  );
}
