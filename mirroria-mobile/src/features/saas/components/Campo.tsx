import React from 'react';
import { View, type TextInputProps } from 'react-native';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface Props extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  label: string;
  value: string | null;
  onChangeText: (v: string) => void;
  error?: string;
  ayuda?: string;
  /** Texto fijo antes del campo (p. ej. "@" o "/t/"). */
  prefijo?: string;
  derecha?: React.ReactNode;
}

/** Etiqueta + campo + ayuda o error: el bloque de todos los formularios del módulo. */
export function Campo({ label, value, onChangeText, error, ayuda, prefijo, derecha, multiline, ...rest }: Props) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-foreground">{label}</Text>
      <View className="flex-row items-center gap-2">
        {prefijo ? <Text className="text-sm text-muted-foreground">{prefijo}</Text> : null}
        <View className="flex-1">
          <Input
            value={value ?? ''}
            onChangeText={onChangeText}
            multiline={multiline}
            aria-invalid={!!error}
            className={cn(error && 'border-destructive', multiline && 'h-24 py-2.5')}
            style={multiline ? { textAlignVertical: 'top' } : undefined}
            {...rest}
          />
        </View>
        {derecha}
      </View>
      {error ? (
        <Text className="text-xs text-destructive">{error}</Text>
      ) : ayuda ? (
        <Text className="text-xs text-muted-foreground">{ayuda}</Text>
      ) : null}
    </View>
  );
}
