import React from 'react';
import { View } from 'react-native';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { fechaIsoValida, PERIODOS, rangoPorDefecto } from '../../lib/periodo';
import type { PeriodoDashboard } from '../../types/dashboard.types';
import { SelectorChips } from '../comun/SelectorChips';
import { SelectorSucursal } from '../comun/SelectorSucursal';

export interface FiltrosResumenProps {
  periodo: PeriodoDashboard;
  fechaInicio?: string;
  fechaFin?: string;
  sucursalId?: string;
  setPeriodo: (p: PeriodoDashboard) => void;
  setFechaInicio: (f?: string) => void;
  setFechaFin: (f?: string) => void;
  setSucursalId: (id?: string) => void;
}

function CampoFecha({
  etiqueta,
  valor,
  onCambiar,
}: {
  etiqueta: string;
  valor?: string;
  onCambiar: (v?: string) => void;
}) {
  const invalida = !!valor && !fechaIsoValida(valor);
  return (
    <View className="flex-1 gap-1">
      <Text className="text-xs text-muted-foreground">{etiqueta}</Text>
      <Input
        value={valor ?? ''}
        onChangeText={(t) => onCambiar(t.trim() || undefined)}
        placeholder="AAAA-MM-DD"
        keyboardType="numbers-and-punctuation"
        maxLength={10}
        className={invalida ? 'border-destructive' : undefined}
      />
    </View>
  );
}

/** Período + sucursal, como la barra de la web; el personalizado pide dos fechas. */
export function FiltrosResumen(f: FiltrosResumenProps) {
  const elegir = (id: PeriodoDashboard) => {
    if (id === 'personalizado' && (!f.fechaInicio || !f.fechaFin)) {
      const r = rangoPorDefecto();
      f.setFechaInicio(f.fechaInicio ?? r.desde);
      f.setFechaFin(f.fechaFin ?? r.hasta);
    }
    f.setPeriodo(id);
  };
  const ordenMal = !!f.fechaInicio && !!f.fechaFin && f.fechaInicio > f.fechaFin;

  return (
    <View className="gap-2.5">
      <SelectorChips etiqueta="Período" opciones={PERIODOS} valor={f.periodo} onCambiar={elegir} />
      {f.periodo === 'personalizado' ? (
        <View className="gap-1">
          <View className="flex-row gap-3">
            <CampoFecha etiqueta="Desde" valor={f.fechaInicio} onCambiar={f.setFechaInicio} />
            <CampoFecha etiqueta="Hasta" valor={f.fechaFin} onCambiar={f.setFechaFin} />
          </View>
          {ordenMal ? (
            <Text className="text-xs text-destructive">
              La fecha «desde» tiene que ser anterior a «hasta».
            </Text>
          ) : null}
        </View>
      ) : null}
      <SelectorSucursal sucursalId={f.sucursalId} onCambiar={f.setSucursalId} />
    </View>
  );
}
