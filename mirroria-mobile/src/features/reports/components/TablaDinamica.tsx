import React from 'react';
import { ScrollView, View } from 'react-native';
import { Search } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useTablaDinamica } from '../hooks/useTablaDinamica';
import { capitalizar, dimensionDelReporte, esMetricaAditiva, metricaDelReporte, nombreDimension, nombreMetrica, opcionesPivote } from '../lib/catalogo';
import { textoConteo } from '../lib/tabla';
import type { Reporte } from '../types/reports.types';
import { Chips } from './Chips';
import { CabeceraTabla, FilaTabla, FilaTotales, type Columnas } from './FilasTabla';

interface Props {
  reporte: Reporte;
  /** Reagrupar ("Ver por sucursal"): vuelve a pedir la ficha al backend con otra dimensión. */
  onPivote?: (dimension: string) => void;
  pivoteando?: boolean;
}

/** Tabla de "Datos": buscar, ordenar tocando la columna, reagrupar y totales. Con comparación, se desliza de costado. */
export function TablaDinamica({ reporte, onPivote, pivoteando }: Props) {
  const { busqueda, setBusqueda, orden, ordenarPor, filas, totalFilas } = useTablaDinamica(reporte);
  const metricaId = metricaDelReporte(reporte);
  const metrica = metricaId ?? '';
  const dimension = dimensionDelReporte(reporte);
  const variaciones = reporte.comparacion?.variaciones;
  const opciones = reporte.esSimulacion ? [] : opcionesPivote(metricaId);
  const puedePivotear = Boolean(onPivote && dimension) && opciones.length >= 2;

  const columnas: Columnas = {
    etiqueta: capitalizar(nombreDimension(dimension) ?? 'detalle'),
    valor: reporte.esSimulacion ? 'Con el escenario' : capitalizar(nombreMetrica(metricaId).replace(/^(el|la|los|las)\s+/, '')),
    comparacion: Boolean(variaciones),
  };

  const tabla = (
    <View className="overflow-hidden rounded-lg border border-border" style={columnas.comparacion ? { width: 520 } : undefined}>
      <CabeceraTabla columnas={columnas} orden={orden} onOrdenar={ordenarPor} />
      {filas.length === 0 ? (
        <Text className="p-4 text-center text-sm text-muted-foreground">
          {busqueda.trim()
            ? `Nada coincide con “${busqueda.trim()}”. Probá con otra palabra o borrá la búsqueda.`
            : 'No hay datos para esta combinación en el período elegido. Probá con otras fechas o agrupando distinto.'}
        </Text>
      ) : (
        filas.map((f, i) => (
          <FilaTabla key={f.clave} fila={f} par={i % 2 === 0} metrica={metrica} dimension={dimension} columnas={columnas}
            variacion={variaciones?.find((v) => v.clave === f.clave)} />
        ))
      )}
      {esMetricaAditiva(metricaId) && filas.length >= 2 ? (
        <FilaTotales filas={filas} metrica={metrica} variaciones={variaciones} columnas={columnas} />
      ) : null}
    </View>
  );

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2">
        <View className="flex-1 justify-center">
          <View className="absolute left-3 z-10">
            <Icon as={Search} size={16} className="text-muted-foreground" />
          </View>
          <Input value={busqueda} onChangeText={setBusqueda} placeholder="Buscar en los datos" accessibilityLabel="Buscar en los datos" className="pl-9" />
        </View>
        <Text className="text-xs text-muted-foreground">{textoConteo(filas.length, totalFilas)}</Text>
      </View>

      {puedePivotear ? (
        <Chips etiqueta="Ver por" opciones={opciones} valor={dimension ?? ''} onCambiar={(d) => d !== dimension && onPivote?.(d)} deshabilitado={pivoteando} />
      ) : null}
      <Text className="text-xs text-muted-foreground">
        {columnas.comparacion
          ? 'Tocá el título de una columna para ordenar. Deslizá la tabla hacia el costado para ver el período anterior y el cambio.'
          : 'Tocá el título de una columna para ordenar.'}
      </Text>

      {columnas.comparacion ? (
        <ScrollView horizontal showsHorizontalScrollIndicator contentContainerClassName="pb-1">
          {tabla}
        </ScrollView>
      ) : (
        tabla
      )}
    </View>
  );
}
