import * as React from 'react';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { View, type TextInputProps } from 'react-native';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { useTema } from '@/contexts/TemaContext';
import { cn } from '@/lib/utils';

interface Props<T extends FieldValues> extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  control: Control<T>;
  nombre: Path<T>;
  etiqueta: string;
}

/** Campo con etiqueta, error de zod debajo y filas de 52 px para el pulgar. */
export function CampoTexto<T extends FieldValues>({ control, nombre, etiqueta, ...props }: Props<T>) {
  const { colores } = useTema();
  return (
    <Controller
      control={control}
      name={nombre}
      render={({ field, fieldState }) => (
        <View className="gap-1.5">
          <Label nativeID={`campo-${nombre}`}>{etiqueta}</Label>
          <Input
            aria-labelledby={`campo-${nombre}`}
            value={field.value as string}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholderTextColor={colores['muted-foreground']}
            className={cn('h-[52px] font-body text-base', fieldState.error && 'border-danger')}
            {...props}
          />
          {fieldState.error ? <Text className="text-xs text-danger">{fieldState.error.message}</Text> : null}
        </View>
      )}
    />
  );
}
