import React from 'react';
import { ActivityIndicator, Linking, View } from 'react-native';
import { Check, MessageCircle } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { estadoCita, estaPorLlegar, linkReconfirmar, pronosticoAsistencia } from '../../lib/citas-hoy';
import type { ReservaHoyItemDto } from '../../types/dashboard.types';
import { EtiquetaTono } from '../comun/EtiquetaTono';

interface Props {
  cita: ReservaHoyItemDto;
  ahora: Date;
  marcando: boolean;
  error?: string;
  onMarcarLlegada: (id: string) => void;
}

/** Una cita del día: hora, clienta, prendas, estado, "¿Vendrá?", "Ya llegó" y WhatsApp. */
export function CitaFila({ cita, ahora, marcando, error, onMarcarLlegada }: Props) {
  const estado = estadoCita(cita.estado, cita.horaPrevista, ahora);
  const vendra = pronosticoAsistencia(cita.estado, cita.probabilidadNoShow);
  const porLlegar = estaPorLlegar(cita.estado);
  const whatsapp = porLlegar
    ? linkReconfirmar(cita.cliente.nombre, cita.cliente.telefono, cita.horaPrevista)
    : null;
  const sugerir = vendra?.tono === 'mal' || vendra?.tono === 'atencion' || estado.etiqueta === 'Pasó la hora';

  return (
    <View className="flex-row gap-3 border-t border-border/70 pt-3">
      <Text className="w-12 pt-0.5 text-sm font-semibold">{cita.horaPrevista}</Text>
      <View className="flex-1 gap-1.5">
        <Text className={cn('text-sm font-medium', !porLlegar && 'text-muted-foreground')}>
          {cita.cliente.nombre}
        </Text>
        {cita.prendas.length > 0 ? (
          <Text className="text-xs text-muted-foreground">
            Apartó: {cita.prendas.map((p) => `${p.nombre} (talla ${p.talla}, ${p.color})`).join(' · ')}
          </Text>
        ) : null}
        <View className="flex-row flex-wrap gap-1.5">
          <EtiquetaTono tono={estado.tono}>{estado.etiqueta}</EtiquetaTono>
          {vendra ? <EtiquetaTono tono={vendra.tono}>¿Vendrá? {vendra.etiqueta}</EtiquetaTono> : null}
        </View>
        {porLlegar ? (
          <View className="flex-row flex-wrap gap-2 pt-1">
            <Button size="sm" variant="outline" disabled={marcando} onPress={() => onMarcarLlegada(cita.reservaId)}>
              {marcando ? <ActivityIndicator size="small" /> : <Icon as={Check} size={16} />}
              <Text>Ya llegó</Text>
            </Button>
            {whatsapp ? (
              <Button size="sm" variant={sugerir ? 'secondary' : 'ghost'} onPress={() => void Linking.openURL(whatsapp)}>
                <Icon as={MessageCircle} size={16} className="text-emerald-600" />
                <Text>Reconfirmar por WhatsApp</Text>
              </Button>
            ) : null}
          </View>
        ) : null}
        {error ? <Text className="text-xs text-destructive">{error}</Text> : null}
      </View>
    </View>
  );
}
