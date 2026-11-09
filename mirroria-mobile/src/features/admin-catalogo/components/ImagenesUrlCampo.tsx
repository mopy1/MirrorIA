import React from 'react';
import { Image, Pressable, View } from 'react-native';
import { Controller, useFieldArray, type Control, type FieldErrors } from 'react-hook-form';
import { ImagePlus, Trash2 } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import type { ProductoFormValues } from '../lib/producto-form';

interface Props {
  control: Control<ProductoFormValues>;
  errors: FieldErrors<ProductoFormValues>;
}

const MAX_FOTOS = 6;

/** Fotos de la prenda por enlace (igual que la web): una fila por foto con su vista previa. */
export function ImagenesUrlCampo({ control, errors }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: 'imagenes' });
  return (
    <View className="gap-2">
      <Label>Fotos de la prenda (enlaces)</Label>
      {fields.map((f, i) => (
        <Controller
          key={f.id}
          control={control}
          name={`imagenes.${i}.url`}
          render={({ field: { value, onChange, onBlur } }) => (
            <View className="gap-1">
              <View className="flex-row items-center gap-2">
                {value && /^https?:\/\//i.test(value) ? (
                  <Image source={{ uri: value }} className="h-11 w-11 rounded-lg bg-muted" resizeMode="cover" />
                ) : (
                  <View className="h-11 w-11 rounded-lg bg-muted" />
                )}
                <Input
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder={i === 0 ? 'https://… foto principal' : 'https://… otra foto'}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  className={`flex-1 ${errors.imagenes?.[i]?.url ? 'border-destructive' : ''}`}
                />
                {fields.length > 1 ? (
                  <Pressable onPress={() => remove(i)} hitSlop={8} accessibilityLabel="Quitar foto" className="h-10 w-10 items-center justify-center rounded-lg active:bg-muted">
                    <Icon as={Trash2} size={18} className="text-muted-foreground" />
                  </Pressable>
                ) : null}
              </View>
              {errors.imagenes?.[i]?.url ? (
                <Text className="text-xs text-destructive">{errors.imagenes[i]?.url?.message}</Text>
              ) : null}
            </View>
          )}
        />
      ))}
      {fields.length < MAX_FOTOS ? (
        <Pressable onPress={() => append({ url: '' })} className="flex-row items-center gap-2 self-start rounded-lg px-2 py-2 active:bg-muted">
          <Icon as={ImagePlus} size={18} className="text-primary" />
          <Text className="text-sm font-medium text-primary">Agregar otra foto</Text>
        </Pressable>
      ) : null}
      <Text className="text-xs text-muted-foreground">La primera foto es la que ven las clientas en la vitrina.</Text>
    </View>
  );
}
