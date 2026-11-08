import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { AvisoError } from '@/src/features/admin-cupones/components/comunes/AvisoError';
import { Campo } from '@/src/features/admin-cupones/components/comunes/Campo';
import { Hoja } from '@/src/features/admin-cupones/components/comunes/Hoja';
import { Opciones } from '@/src/features/admin-cupones/components/comunes/Opciones';
import { armarSucursalDto, ciudadesOrdenadas, SUCURSAL_VACIA, sucursalSchema, type SucursalFormValues } from '../lib/sucursales';
import type { Ciudad, CreateSucursalDto } from '../types/sucursales-admin.types';

interface Props {
  visible: boolean;
  ciudades: Ciudad[];
  guardando: boolean;
  error: string | null;
  onCerrar: () => void;
  onCrear: (dto: CreateSucursalDto) => Promise<boolean>;
}

/** "Nueva sucursal" de la web en una hoja inferior. La ciudad sale de la lista global. */
export function SucursalFormHoja({ visible, ciudades, guardando, error, onCerrar, onCrear }: Props) {
  const { control, handleSubmit, reset, formState: { errors } } = useForm<SucursalFormValues>({
    resolver: zodResolver(sucursalSchema),
    defaultValues: SUCURSAL_VACIA,
  });

  useEffect(() => {
    if (visible) reset(SUCURSAL_VACIA);
  }, [visible, reset]);

  const enviar = handleSubmit(async (v) => {
    if (await onCrear(armarSucursalDto(v))) onCerrar();
  });

  return (
    <Hoja
      visible={visible}
      titulo="Nueva sucursal"
      descripcion="Una tienda física con su propio inventario."
      onCerrar={onCerrar}
      pie={
        <>
          <Button variant="outline" className="flex-1" onPress={onCerrar} disabled={guardando}>
            <Text>Cancelar</Text>
          </Button>
          <Button className="flex-1" onPress={enviar} disabled={guardando}>
            <Text>{guardando ? 'Guardando…' : 'Crear'}</Text>
          </Button>
        </>
      }
    >
      <AvisoError mensaje={error} />
      <Controller
        control={control}
        name="ciudadId"
        render={({ field }) => (
          <Opciones
            label="Ciudad"
            enFila
            valor={field.value}
            onCambiar={field.onChange}
            error={errors.ciudadId?.message}
            opciones={ciudadesOrdenadas(ciudades).map((c) => ({ valor: c.id, etiqueta: c.nombre }))}
          />
        )}
      />
      <Campo control={control} name="nombre" label="Nombre" placeholder="Ej: Sucursal Centro" error={errors.nombre?.message} />
      <Campo control={control} name="direccion" label="Dirección" placeholder="Ej: Av. 16 de Julio 1234" error={errors.direccion?.message} />
      <Campo control={control} name="telefono" label="Teléfono (opcional)" placeholder="Ej: 2 2412345" teclado="phone-pad" />
    </Hoja>
  );
}
