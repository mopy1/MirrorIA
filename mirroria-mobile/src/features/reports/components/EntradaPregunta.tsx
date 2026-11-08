import React from 'react';
import { ActivityIndicator, TextInput, View } from 'react-native';
import { Mic, MicOff, Send } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { useDictado } from '../hooks/useDictado';

interface Props {
  pregunta: string;
  onCambiar: (t: string) => void;
  onEnviar: () => void;
  cargando: boolean;
  dictado: ReturnType<typeof useDictado>;
}

/** Caja de la pregunta: escribir o dictar con el micrófono. */
export function EntradaPregunta({ pregunta, onCambiar, onEnviar, cargando, dictado }: Props) {
  const vacia = pregunta.trim().length < 3;
  return (
    <View className="gap-2">
      <View className={cn('rounded-2xl border bg-background px-3 pt-2', dictado.escuchando ? 'border-primary' : 'border-input')}>
        <TextInput
          value={pregunta}
          onChangeText={onCambiar}
          placeholder="Ej.: ¿qué vendí más este mes?"
          accessibilityLabel="Tu pregunta para la IA"
          multiline
          className="min-h-12 max-h-32 text-base text-foreground"
          placeholderTextColor="#8a8a8a"
          onSubmitEditing={() => !vacia && !cargando && onEnviar()}
          blurOnSubmit
        />
        <View className="flex-row items-center justify-between pb-2">
          <Text className="flex-1 text-xs text-muted-foreground">
            {dictado.escuchando ? 'Escuchando… tocá el micrófono para terminar' : 'Escribí o dictá tu pregunta'}
          </Text>
          <View className="flex-row gap-2">
            <Button
              variant={dictado.escuchando ? 'secondary' : 'outline'}
              size="icon"
              disabled={cargando}
              onPress={dictado.alternar}
              accessibilityLabel={dictado.escuchando ? 'Terminar el dictado' : 'Dictar la pregunta'}
              accessibilityState={{ selected: dictado.escuchando }}
              className="h-11 w-11 rounded-full"
            >
              <Icon as={dictado.disponible ? Mic : MicOff} size={18} className={dictado.escuchando ? 'text-primary' : 'text-foreground'} />
            </Button>
            <Button size="icon" disabled={vacia || cargando} onPress={onEnviar} accessibilityLabel="Enviar pregunta" className="h-11 w-11 rounded-full">
              {cargando ? <ActivityIndicator color="white" /> : <Icon as={Send} size={18} className="text-primary-foreground" />}
            </Button>
          </View>
        </View>
      </View>

      {dictado.avisoPermiso ? (
        <View className="gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-3.5">
          <Text className="text-sm font-semibold">¿Usamos el micrófono?</Text>
          <Text className="text-sm leading-5">
            Para dictar la pregunta, MirrorIA necesita permiso para usar el micrófono. Solo escucha mientras dictás y lo que decís
            se convierte en texto; no se guarda el audio.
          </Text>
          <View className="flex-row gap-2">
            <Button className="flex-1" onPress={dictado.aceptarPermiso}><Text>Permitir micrófono</Text></Button>
            <Button className="flex-1" variant="outline" onPress={dictado.cancelarPermiso}><Text>Ahora no</Text></Button>
          </View>
        </View>
      ) : null}
      {dictado.error ? <Text accessibilityRole="alert" className="text-sm text-destructive">{dictado.error}</Text> : null}
    </View>
  );
}
