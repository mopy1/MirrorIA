import React, { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { FileSpreadsheet, FileText, X } from 'lucide-react-native';
import { BarrasHorizontales } from '@/components/admin/Graficos';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { reportsApi } from '../api/reportsApi';
import { useExportar } from '../hooks/useExportar';
import { dimensionDelReporte, metricaDelReporte } from '../lib/catalogo';
import { extraerConclusion, parrafosNarrativa } from '../lib/chat';
import { etiquetaFila, formatearValor } from '../lib/formato';
import type { Reporte, ReporteAbierto } from '../types/reports.types';
import { TablaDinamica } from './TablaDinamica';

const hora = (d: Date) => d.toLocaleString('es-BO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View className="gap-2 border-t border-border pt-4">
      <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</Text>
      {children}
    </View>
  );
}

/** El reporte como documento: título → conclusión → exportar → gráfico → análisis → datos. */
export function TarjetaReporte({ abierto, onCerrar, onReemplazar }: {
  abierto: ReporteAbierto;
  onCerrar: () => void;
  onReemplazar: (r: Reporte) => void;
}) {
  const { reporte, titulo } = abierto;
  const { exportar, exportando, error } = useExportar();
  const [pivoteando, setPivoteando] = useState(false);
  const [errorPivote, setErrorPivote] = useState<string | null>(null);
  const metrica = metricaDelReporte(reporte) ?? '';
  const dimension = dimensionDelReporte(reporte);
  const conclusion = extraerConclusion(reporte.narrativa, 260);
  const analisis = parrafosNarrativa(reporte.narrativa).filter((p) => p !== conclusion);
  const sinFilas = reporte.filas.length === 0;
  const top = [...reporte.filas].sort((a, b) => b.valor - a.valor).slice(0, 8);

  async function pivotear(nueva: string) {
    setPivoteando(true);
    setErrorPivote(null);
    try {
      onReemplazar(await reportsApi.consultar({ ...reporte.ficha, agruparPor: nueva }));
    } catch (e) {
      setErrorPivote(e instanceof Error ? e.message : 'No se pudo reagrupar el reporte.');
    } finally {
      setPivoteando(false);
    }
  }

  return (
    <View className="gap-4 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-start gap-2">
        <View className="flex-1 gap-1">
          <Text className="text-lg font-bold leading-6">{titulo}</Text>
          <Text className="text-xs text-muted-foreground">
            {abierto.pregunta ? 'Con IA' : 'Armado sin IA'} · {hora(abierto.generadoEn)}
          </Text>
        </View>
        <Pressable onPress={onCerrar} accessibilityRole="button" accessibilityLabel="Cerrar este reporte" className="h-10 w-10 items-center justify-center rounded-full">
          <Icon as={X} size={18} className="text-muted-foreground" />
        </Pressable>
      </View>

      {conclusion ? <Text className="text-base leading-6">{conclusion}</Text> : null}

      <View className="gap-2">
        <View className="flex-row gap-2">
          <Button className="flex-1" onPress={() => exportar(reporte, titulo, 'excel')} disabled={Boolean(exportando) || sinFilas}>
            {exportando === 'excel' ? <ActivityIndicator color="white" /> : <Icon as={FileSpreadsheet} size={16} className="text-primary-foreground" />}
            <Text>{exportando === 'excel' ? 'Preparando…' : 'Excel'}</Text>
          </Button>
          <Button className="flex-1" variant="outline" onPress={() => exportar(reporte, titulo, 'pdf')} disabled={Boolean(exportando) || sinFilas}>
            {exportando === 'pdf' ? <ActivityIndicator /> : <Icon as={FileText} size={16} className="text-foreground" />}
            <Text>{exportando === 'pdf' ? 'Preparando…' : 'PDF'}</Text>
          </Button>
        </View>
        {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
      </View>

      {top.length > 1 ? (
        <Bloque titulo="De un vistazo">
          <BarrasHorizontales datos={top.map((f) => ({ etiqueta: etiquetaFila(f.etiqueta, dimension), valor: f.valor }))} formato={(n) => formatearValor(n, metrica)} />
        </Bloque>
      ) : null}

      {analisis.length > 0 ? (
        <Bloque titulo="Análisis de la IA">
          {analisis.map((p, i) => <Text key={i} className="text-sm leading-6">{p}</Text>)}
        </Bloque>
      ) : null}

      <Bloque titulo="Datos">
        <TablaDinamica reporte={reporte} onPivote={pivotear} pivoteando={pivoteando} />
        {errorPivote ? <Text className="text-sm text-destructive">{errorPivote}</Text> : null}
      </Bloque>
    </View>
  );
}
