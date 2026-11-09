import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { armarCuponDto, cuponSchema, ETIQUETA_TIPO, valoresIniciales, type CuponFormValues } from '../lib/cupones';
import type { CreateCuponDto } from '../types/cupones.types';
import { AvisoError } from './comunes/AvisoError';
import { Campo } from './comunes/Campo';
import { Hoja } from './comunes/Hoja';
import { Opciones } from './comunes/Opciones';

interface Props {
  visible: boolean;
  guardando: boolean;
  error: string | null;
  onCerrar: () => void;
  onCrear: (dto: CreateCuponDto) => Promise<boolean>;
}

/** Alta de cupón (CrearCuponDialog de la web) en una hoja inferior. */
export function CuponFormHoja({ visible, guardando, error, onCerrar, onCrear }: Props) {
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<CuponFormValues>({
    resolver: zodResolver(cuponSchema),
    defaultValues: valoresIniciales(),
  });
  const tipo = watch('tipoDescuento');

  useEffect(() => {
    if (visible) reset(valoresIniciales());
  }, [visible, reset]);

  const enviar = handleSubmit(async (v) => {
    if (await onCrear(armarCuponDto(v))) onCerrar();
  });

  return (
    <Hoja
      visible={visible}
      titulo="Crear cupón de descuento"
      descripcion="Genera un código promocional para aplicar en checkout y tienda."
      onCerrar={onCerrar}
      pie={
        <>
          <Button variant="outline" className="flex-1" onPress={onCerrar} disabled={guardando}>
            <Text>Cancelar</Text>
          </Button>
          <Button className="flex-1" onPress={enviar} disabled={guardando}>
            <Text>{guardando ? 'Guardando…' : 'Crear cupón'}</Text>
          </Button>
        </>
      }
    >
      <AvisoError mensaje={error} />
      <Campo control={control} name="codigo" label="Código del cupón" placeholder="EJ: VERANO20" mayusculas error={errors.codigo?.message} />
      <Controller
        control={control}
        name="tipoDescuento"
        render={({ field }) => (
          <Opciones
            label="Tipo de descuento"
            enFila
            valor={field.value}
            onCambiar={field.onChange}
            opciones={[
              { valor: 'PORCENTAJE', etiqueta: ETIQUETA_TIPO.PORCENTAJE },
              { valor: 'MONTO_FIJO', etiqueta: ETIQUETA_TIPO.MONTO_FIJO },
            ]}
          />
        )}
      />
      <Campo
        control={control}
        name="valor"
        label={tipo === 'PORCENTAJE' ? 'Porcentaje de descuento' : 'Monto a descontar (Bs.)'}
        placeholder={tipo === 'PORCENTAJE' ? 'Ej: 15' : 'Ej: 50.00'}
        teclado="decimal-pad"
        error={errors.valor?.message}
      />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Campo control={control} name="fechaInicio" label="Fecha de inicio" placeholder="AAAA-MM-DD" error={errors.fechaInicio?.message} />
        </View>
        <View className="flex-1">
          <Campo control={control} name="fechaFin" label="Vencimiento" placeholder="AAAA-MM-DD" error={errors.fechaFin?.message} />
        </View>
      </View>
      <Campo
        control={control}
        name="usosMaximos"
        label="Límite de canjes (opcional)"
        placeholder="Ilimitado si se deja vacío"
        teclado="numeric"
        error={errors.usosMaximos?.message}
      />
      <Campo
        control={control}
        name="montoMinimo"
        label="Monto mínimo de compra en Bs. (opcional)"
        placeholder="Ej: 150.00 (sin mínimo si se deja vacío)"
        teclado="decimal-pad"
        error={errors.montoMinimo?.message}
      />
    </Hoja>
  );
}
