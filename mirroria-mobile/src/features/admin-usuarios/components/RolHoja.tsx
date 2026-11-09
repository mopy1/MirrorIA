import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { AvisoError } from '@/src/features/admin-cupones/components/comunes/AvisoError';
import { Hoja } from '@/src/features/admin-cupones/components/comunes/Hoja';
import { Opciones } from '@/src/features/admin-cupones/components/comunes/Opciones';
import {
  armarCambioRol, etiquetaRol, hayCambios, necesitaSucursal, ROLES, ROLES_LISTA, rolSchema, valoresRol, type RolFormValues,
} from '../lib/usuarios';
import type { CambioRolDto, SucursalOpcion, UsuarioAdmin } from '../types/usuarios-admin.types';

interface Props {
  usuario: UsuarioAdmin | null;
  sucursales: SucursalOpcion[];
  guardando: boolean;
  error: string | null;
  onCerrar: () => void;
  onGuardar: (id: string, dto: CambioRolDto) => Promise<boolean>;
}

/** "Modificar rol de usuario" de la web: rol + sucursal obligatoria para el staff de sucursal. */
export function RolHoja({ usuario, sucursales, guardando, error, onCerrar, onGuardar }: Props) {
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<RolFormValues>({
    resolver: zodResolver(rolSchema),
    defaultValues: { role: 'CUSTOMER', sucursalId: '' },
    mode: 'onChange',
  });
  const valores = watch();

  useEffect(() => {
    if (usuario) reset(valoresRol(usuario));
  }, [usuario, reset]);

  if (!usuario) return null;
  const conSucursal = necesitaSucursal(valores.role);
  const faltaSucursal = conSucursal && !valores.sucursalId;
  const enviar = handleSubmit(async (v) => {
    if (await onGuardar(usuario.id, armarCambioRol(v))) onCerrar();
  });

  return (
    <Hoja
      visible
      titulo="Modificar rol de usuario"
      descripcion="Asigna permisos y la sucursal operativa para esta cuenta."
      onCerrar={onCerrar}
      pie={
        <>
          <Button variant="outline" className="flex-1" onPress={onCerrar}>
            <Text>Cancelar</Text>
          </Button>
          <Button className="flex-1" onPress={enviar} disabled={guardando || faltaSucursal || !hayCambios(usuario, valores)}>
            <Text>{guardando ? 'Guardando…' : 'Guardar cambios'}</Text>
          </Button>
        </>
      }
    >
      <View className="rounded-xl border border-border bg-muted/40 p-3">
        <Text className="text-sm font-medium">{usuario.fullName}</Text>
        <Text className="text-xs text-muted-foreground">
          {usuario.email} · {etiquetaRol(usuario.role)}
        </Text>
      </View>
      <Controller
        control={control}
        name="role"
        render={({ field }) => (
          <Opciones
            label="Rol en el sistema"
            valor={field.value}
            onCambiar={field.onChange}
            opciones={ROLES_LISTA.map((r) => ({ valor: r, etiqueta: ROLES[r].label, detalle: ROLES[r].descripcion }))}
          />
        )}
      />
      {conSucursal ? (
        <Controller
          control={control}
          name="sucursalId"
          render={({ field }) => (
            <View className="gap-1">
              <Opciones
                label="Sucursal asignada *"
                valor={field.value}
                onCambiar={field.onChange}
                error={faltaSucursal ? errors.sucursalId?.message ?? 'Este rol requiere asignar una sucursal obligatoriamente.' : undefined}
                opciones={sucursales.map((s) => ({ valor: s.id, etiqueta: s.nombre, detalle: s.ciudadNombre }))}
              />
              {!faltaSucursal ? (
                <Text className="text-xs text-muted-foreground">La sede física donde operará el usuario.</Text>
              ) : null}
            </View>
          )}
        />
      ) : null}
      <AvisoError mensaje={error} />
    </Hoja>
  );
}
