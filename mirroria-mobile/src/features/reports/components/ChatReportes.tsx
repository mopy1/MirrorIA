import React, { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useDictado } from '../hooks/useDictado';
import { SUGERENCIAS } from '../lib/chat';
import type { MensajeChat } from '../types/reports.types';
import { BurbujaMensaje } from './BurbujaMensaje';
import { EntradaPregunta } from './EntradaPregunta';

interface Props {
  mensajes: MensajeChat[];
  pensando: boolean;
  onPreguntar: (texto: string) => void;
  onVerReporte: (id: string) => void;
}

/** Pedir el reporte en lenguaje natural, por texto o por voz (como el asistente de la web). */
export function ChatReportes({ mensajes, pensando, onPreguntar, onVerReporte }: Props) {
  const [pregunta, setPregunta] = useState('');

  function enviar(texto = pregunta) {
    if (texto.trim().length < 3 || pensando) return;
    onPreguntar(texto);
    setPregunta('');
  }

  const dictado = useDictado({ onTextoFinal: (t) => enviar(t), onTextoParcial: setPregunta });

  return (
    <View className="gap-4">
      {mensajes.length === 0 ? (
        <View className="items-center gap-3 rounded-2xl border border-border bg-card p-5">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Icon as={Sparkles} size={22} className="text-primary" />
          </View>
          <Text className="text-center text-base font-semibold">Preguntá en tus palabras</Text>
          <Text className="text-center text-sm text-muted-foreground">
            Te armo el reporte con los datos reales de tu tienda. Podés escribir o tocar el micrófono y dictar.
          </Text>
          <View className="w-full gap-2">
            {SUGERENCIAS.map((s) => (
              <Pressable key={s} onPress={() => enviar(s)} accessibilityRole="button" className="rounded-xl border border-border px-3.5 py-3">
                <Text className="text-sm">{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <View className="gap-3">
          {mensajes.map((m) => (
            <BurbujaMensaje key={m.id} mensaje={m} onVerReporte={onVerReporte} onPreguntar={enviar} onReintentar={enviar} />
          ))}
          {pensando ? (
            <View className="flex-row items-center gap-2 self-start rounded-2xl border border-border bg-card px-3.5 py-2.5">
              <ActivityIndicator size="small" />
              <Text className="text-sm text-muted-foreground">Armando tu reporte…</Text>
            </View>
          ) : null}
        </View>
      )}

      <EntradaPregunta pregunta={pregunta} onCambiar={setPregunta} onEnviar={() => enviar()} cargando={pensando} dictado={dictado} />
    </View>
  );
}
