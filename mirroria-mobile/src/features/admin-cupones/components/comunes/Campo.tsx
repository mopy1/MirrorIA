import React from 'react';
import { View } from 'react-native';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';

interface Props<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  error?: string;
  ayuda?: string;
  placeholder?: string;
  teclado?: 'default' | 'numeric' | 'decimal-pad' | 'phone-pad';
  mayusculas?: boolean;
}

/** Campo de texto enlazado a react-hook-form, con su error (o ayuda) debajo. */
export function Campo<T extends FieldValues>({
  control,
  name,
  label,
  error,
  ayuda,
  placeholder,
  teclado = 'default',
  mayusculas,
}: Props<T>) {
  return (
    <View className="gap-1.5">
      <Label>{label}</Label>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            value={value ?? ''}
            onChangeText={(t) => onChange(mayusculas ? t.toUpperCase() : t)}
            onBlur={onBlur}
            placeholder={placeholder}
            keyboardType={teclado}
            autoCapitalize={mayusculas ? 'characters' : 'sentences'}
            autoCorrect={false}
            accessibilityLabel={label}
            className={error ? 'border-destructive' : ''}
          />
        )}
      />
      {error ? (
        <Text className="text-xs text-destructive">{error}</Text>
      ) : ayuda ? (
        <Text className="text-xs text-muted-foreground">{ayuda}</Text>
      ) : null}
    </View>
  );
}
