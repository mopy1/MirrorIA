import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { EtiquetaTono } from '@/src/features/dashboard/components/comun/EtiquetaTono';
import { SelectorChips } from '@/src/features/dashboard/components/comun/SelectorChips';
import { formatMoney } from '@/src/lib/money';
import { humanizarAnomalia } from '../lib/ml-anomalias.utils';
import { contar, formatearHora, metodoPagoHumano } from '../lib/ml-lenguaje';
import { formatearNombreVenta } from '../lib/ml.utils';
import type { AnomaliasVentasResponse, ItemDiagnosticoAnomalia } from '../types/ml.types';
import { BloqueMl } from './BloqueMl';

function Fila({ venta }: { venta: ItemDiagnosticoAnomalia }) {
  const { inusual, estado, motivos } = humanizarAnomalia(venta);
  const hora = formatearHora(venta.hora_venta);
  const titulo = formatearNombreVenta(venta.venta_id) ?? (hora ? `Venta de las ${hora}` : 'Venta');
  const datos = [
    typeof venta.monto_total_cents === 'number' ? formatMoney(venta.monto_total_cents) : null,
    hora && !titulo.includes(hora) ? hora : null,
    metodoPagoHumano(venta.metodo_pago),
  ].filter(Boolean);
  return (
    <View className="gap-1 border-t border-border/70 pt-3">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="flex-1 text-sm font-medium">{titulo}</Text>
        <EtiquetaTono tono={inusual ? (venta.nivel_riesgo === 'CRITICO' ? 'critico' : 'alerta') : 'bien'}>{estado}</EtiquetaTono>
      </View>
      {datos.length > 0 ? <Text className="text-sm text-muted-foreground">{datos.join(' · ')}</Text> : null}
      {inusual ? <Text className="text-sm">{motivos.join(' · ')}</Text> : null}
    </View>
  );
}

interface Props {
  data: AnomaliasVentasResponse | null;
  isLoading: boolean;
  error: string | null;
  onReintentar: () => void;
  soloDuena: boolean;
}

/** "Ventas para revisar": ventas recientes que no se parecen a las de siempre. */
export function SeccionVentas({ data, isLoading, error, onReintentar, soloDuena }: Props) {
  const router = useRouter();
  const ventas = useMemo(() => data?.diagnosticos ?? [], [data]);
  const inusuales = useMemo(() => ventas.filter((v) => v.es_anomalo), [ventas]);
  const [elegido, setElegido] = useState<'inusuales' | 'todas' | null>(null);
  const filtro = elegido ?? (inusuales.length > 0 ? 'inusuales' : 'todas');
  const lista = filtro === 'inusuales' ? inusuales : ventas;
  const frase =
    data && ventas.length > 0
      ? inusuales.length > 0
        ? `${contar(inusuales.length, 'venta se ve inusual', 'ventas se ven inusuales')} entre las últimas ${ventas.length} (${formatMoney(data.monto_sospechoso_cents)}). Confirmá con caja que estén bien.`
        : `Las últimas ${ventas.length} ventas se ven normales.`
      : undefined;

  return (
    <BloqueMl
      titulo="Ventas para revisar"
      frase={frase}
      enlace={{ texto: 'Ir a Ventas', onPress: () => router.push('/admin/ventas') }}
      isLoading={isLoading}
      error={error}
      hayDatos={!!data}
      que="las ventas recientes"
      onReintentar={onReintentar}
      soloDuena={soloDuena}
      vacio={ventas.length === 0 ? { titulo: 'Todavía no hay ventas para revisar', detalle: 'Cada venta que registres en caja se compara con las anteriores; si alguna se ve rara, aparece acá.' } : null}>
      <SelectorChips
        etiqueta="Qué ventas mostrar"
        valor={filtro}
        onCambiar={setElegido}
        opciones={[
          { id: 'inusuales', label: `Inusuales (${inusuales.length})` },
          { id: 'todas', label: `Todas (${ventas.length})` },
        ]}
      />
      {lista.length === 0 ? (
        <Text className="py-4 text-center text-sm text-muted-foreground">Ninguna venta inusual: todo en orden.</Text>
      ) : (
        lista.map((v) => <Fila key={v.venta_id} venta={v} />)
      )}
    </BloqueMl>
  );
}
