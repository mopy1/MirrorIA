import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Play } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useConstructor } from '../hooks/useConstructor';
import { METRICAS_DISPONIBLES, dimensionesParaMetrica, filtrosDeMetrica, metricaConTiempo } from '../lib/catalogo';
import { CANALES, LIMITES, METODOS_PAGO, RANGOS_PRESET, puedeComparar } from '../lib/constructor';
import type { Reporte } from '../types/reports.types';
import { Chips, Interruptor } from './Chips';

const ORDENES = [
  { id: 'desc', label: 'De mayor a menor' },
  { id: 'asc', label: 'De menor a mayor' },
];

interface Props {
  /** Solo la dueña elige sucursal; a la encargada el backend le muestra la suya. */
  elegirSucursal: boolean;
  onGenerado: (reporte: Reporte, titulo: string) => void;
}

/** Armar un reporte sin IA: métrica, filas (agrupar por), columnas, filtros, fechas, orden y cantidad. */
export function ConstructorReporte({ elegirSucursal, onGenerado }: Props) {
  const { op, cambiar, sucursales, cargando, error, generar } = useConstructor(elegirSucursal, onGenerado);
  const conTiempo = metricaConTiempo(op.metrica);
  const filtros = filtrosDeMetrica(op.metrica);

  return (
    <View className="gap-5 rounded-2xl border border-border bg-card p-4">
      <View className="gap-1">
        <Text className="text-base font-semibold">Armar un reporte sin IA</Text>
        <Text className="text-xs text-muted-foreground">Elegí qué medir y cómo verlo. Anda aunque la IA no esté disponible.</Text>
      </View>

      <Chips etiqueta="Qué querés medir" opciones={METRICAS_DISPONIBLES} valor={op.metrica} onCambiar={(v) => cambiar('metrica', v)} />
      <Chips
        etiqueta="Filas: agrupar por"
        ayuda="Cada fila de la tabla será una de estas."
        opciones={dimensionesParaMetrica(op.metrica)}
        valor={op.agruparPor}
        onCambiar={(v) => cambiar('agruparPor', v)}
      />

      {conTiempo ? (
        <Chips etiqueta="Fechas" opciones={RANGOS_PRESET} valor={op.presetFecha} onCambiar={(v) => cambiar('presetFecha', v)} />
      ) : (
        <Text className="text-xs text-muted-foreground">El stock es una foto de hoy: no lleva rango de fechas.</Text>
      )}

      <Interruptor
        etiqueta="Columnas: comparar con el período anterior"
        ayuda={puedeComparar(op) ? 'Suma las columnas «Período anterior» y «Cambio».' : 'Elegí un rango de fechas cerrado para poder comparar.'}
        valor={op.comparar && puedeComparar(op)}
        onCambiar={(v) => cambiar('comparar', v)}
        deshabilitado={!puedeComparar(op)}
      />

      {elegirSucursal && sucursales.length > 0 ? (
        <Chips etiqueta="Sucursal" opciones={[{ id: 'todas', label: 'Todas' }, ...sucursales]} valor={op.sucursalId} onCambiar={(v) => cambiar('sucursalId', v)} />
      ) : null}
      {filtros.includes('canal') ? (
        <Chips etiqueta="Canal de venta" opciones={CANALES} valor={op.canal} onCambiar={(v) => cambiar('canal', v)} />
      ) : null}
      {filtros.includes('metodoPago') ? (
        <Chips etiqueta="Forma de pago" opciones={METODOS_PAGO} valor={op.metodoPago} onCambiar={(v) => cambiar('metodoPago', v)} />
      ) : null}

      <Chips etiqueta="Orden" opciones={ORDENES} valor={op.orden} onCambiar={(v) => cambiar('orden', v as 'asc' | 'desc')} />
      <Chips
        etiqueta="Cuántas filas como máximo"
        opciones={LIMITES.map((n) => ({ id: String(n), label: String(n) }))}
        valor={String(op.limite)}
        onCambiar={(v) => cambiar('limite', Number(v))}
      />

      {error ? (
        <View className="rounded-lg bg-destructive/10 p-3">
          <Text className="text-sm text-destructive">{error}</Text>
        </View>
      ) : null}

      <Button size="lg" onPress={generar} disabled={cargando} accessibilityLabel="Generar reporte">
        {cargando ? <ActivityIndicator color="white" /> : <Icon as={Play} size={16} className="text-primary-foreground" />}
        <Text>{cargando ? 'Generando…' : 'Generar reporte'}</Text>
      </Button>
    </View>
  );
}
