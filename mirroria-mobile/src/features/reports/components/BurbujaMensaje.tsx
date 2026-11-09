import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { MensajeChat } from '../types/reports.types';

interface Props {
  mensaje: MensajeChat;
  onVerReporte?: (id: string) => void;
  onPreguntar: (texto: string) => void;
  onReintentar?: (pregunta: string) => void;
}

/** Burbuja del chat: la persona a la derecha; el asistente con la conclusión corta y "Ver reporte". */
export function BurbujaMensaje({ mensaje: m, onVerReporte, onPreguntar, onReintentar }: Props) {
  const usuario = m.rol === 'usuario';
  return (
    <View className={cn('max-w-[88%] gap-2 rounded-2xl px-3.5 py-2.5', usuario ? 'self-end bg-primary' : 'self-start border',
      !usuario && (m.tono === 'error' ? 'border-destructive/40 bg-destructive/5' : 'border-border bg-card'))}>
      <Text className={cn('text-sm leading-5', usuario ? 'text-primary-foreground' : m.tono === 'error' ? 'text-destructive' : 'text-foreground')}>
        {m.texto}
      </Text>
      {m.sugerencias?.map((s) => (
        <Pressable key={s} onPress={() => onPreguntar(s)} accessibilityRole="button" className="rounded-full border border-border px-3 py-1.5">
          <Text className="text-xs">{s}</Text>
        </Pressable>
      ))}
      {m.reporteId && onVerReporte ? (
        <Pressable onPress={() => onVerReporte(m.reporteId!)} accessibilityRole="button" className="self-start rounded-full bg-primary/10 px-3 py-1.5">
          <Text className="text-xs font-semibold text-primary">Ver reporte</Text>
        </Pressable>
      ) : null}
      {m.reintentable && m.pregunta && onReintentar ? (
        <Pressable onPress={() => onReintentar(m.pregunta!)} accessibilityRole="button" className="self-start rounded-full border border-border px-3 py-1.5">
          <Text className="text-xs font-semibold">Reintentar</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
