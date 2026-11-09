import React from 'react';
import { View } from 'react-native';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

/** Etiqueta + contenido + ayuda/error: el envoltorio de todo campo de los formularios del panel. */
export function Campo({
  etiqueta,
  error,
  ayuda,
  children,
}: {
  etiqueta: string;
  error?: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-0.5">
      <Label>{etiqueta}</Label>
      {children}
      {error ? (
        <Text className="text-xs text-destructive mt-1">{error}</Text>
      ) : ayuda ? (
        <Text className="text-xs text-muted-foreground mt-1">{ayuda}</Text>
      ) : null}
    </View>
  );
}

type InputProps = React.ComponentProps<typeof Input>;

interface CampoTextoProps<T extends FieldValues> extends Omit<InputProps, 'value' | 'onChangeText'> {
  control: Control<T>;
  name: Path<T>;
  etiqueta: string;
  error?: string;
  ayuda?: string;
  /** Avisa además de cada cambio (p. ej. para sugerir el slug a partir del título). */
  alCambiar?: (texto: string) => void;
}

/** Input de texto ligado a react-hook-form. */
export function CampoTexto<T extends FieldValues>({
  control,
  name,
  etiqueta,
  error,
  ayuda,
  alCambiar,
  className,
  ...resto
}: CampoTextoProps<T>) {
  return (
    <Campo etiqueta={etiqueta} error={error} ayuda={ayuda}>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value, ref } }) => (
          <Input
            ref={ref}
            value={value == null ? '' : String(value)}
            onChangeText={(t) => {
              onChange(t);
              alCambiar?.(t);
            }}
            onBlur={onBlur}
            className={cn(error ? 'border-destructive' : '', className)}
            {...resto}
          />
        )}
      />
    </Campo>
  );
}
