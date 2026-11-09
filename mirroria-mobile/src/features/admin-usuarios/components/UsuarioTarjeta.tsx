import React from 'react';
import { View } from 'react-native';
import { AlertTriangle, Pencil, Store, UserCheck, UserMinus } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { iniciales } from '@/src/features/admin-cupones/lib/comunes';
import { etiquetaRol, sinSucursal } from '../lib/usuarios';
import type { UsuarioAdmin } from '../types/usuarios-admin.types';

const COLOR_ROL: Record<string, { caja: string; texto: string }> = {
  ADMIN: { caja: 'border-primary/30 bg-primary/10', texto: 'text-primary' },
  ENCARGADO_SUCURSAL: { caja: 'border-purple-500/30 bg-purple-500/10', texto: 'text-purple-700 dark:text-purple-300' },
  CAJERO: { caja: 'border-amber-500/30 bg-amber-500/10', texto: 'text-amber-700 dark:text-amber-300' },
};
const COLOR_CLIENTE = { caja: 'border-border bg-muted', texto: 'text-muted-foreground' };

interface Props {
  usuario: UsuarioAdmin;
  sucursalNombre?: string;
  esYo: boolean;
  cambiando: boolean;
  onCambiarRol: () => void;
  onAlternarEstado: () => void;
}

/** Una fila de la tabla "Usuarios" de la web, hecha tarjeta. */
export function UsuarioTarjeta({ usuario, sucursalNombre, esYo, cambiando, onCambiarRol, onAlternarEstado }: Props) {
  const color = COLOR_ROL[usuario.role] ?? COLOR_CLIENTE;
  return (
    <View className="gap-3 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-center gap-3">
        <View className="size-10 items-center justify-center rounded-full bg-primary/10">
          <Text className="text-xs font-semibold text-primary">{iniciales(usuario.fullName)}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold" numberOfLines={1}>
            {usuario.fullName}
            {esYo ? <Text className="text-sm font-normal text-muted-foreground"> (vos)</Text> : null}
          </Text>
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {usuario.email}
          </Text>
        </View>
        <View className={cn('flex-row items-center gap-1.5 rounded-full border px-2.5 py-0.5', usuario.isActive ? 'border-emerald-500/25 bg-emerald-500/10' : 'border-destructive/25 bg-destructive/10')}>
          <View className={cn('size-1.5 rounded-full', usuario.isActive ? 'bg-emerald-600' : 'bg-destructive')} />
          <Text className={cn('text-xs font-medium', usuario.isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-destructive')}>
            {usuario.isActive ? 'Activo' : 'Inactivo'}
          </Text>
        </View>
      </View>

      <View className="flex-row flex-wrap items-center gap-2">
        <View className={cn('rounded-full border px-2.5 py-1', color.caja)}>
          <Text className={cn('text-xs font-medium', color.texto)}>{etiquetaRol(usuario.role)}</Text>
        </View>
        {sucursalNombre ? (
          <View className="flex-row items-center gap-1">
            <Icon as={Store} size={13} className="text-muted-foreground" />
            <Text className="text-xs text-muted-foreground">{sucursalNombre}</Text>
          </View>
        ) : null}
        {sinSucursal(usuario) ? (
          <View className="flex-row items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5">
            <Icon as={AlertTriangle} size={12} className="text-amber-700" />
            <Text className="text-[11px] text-amber-700 dark:text-amber-300">Sin sucursal asignada</Text>
          </View>
        ) : null}
      </View>

      <View className="flex-row gap-2">
        <Button variant="outline" className="flex-1 flex-row gap-1.5" onPress={onCambiarRol}>
          <Icon as={Pencil} size={15} className="text-foreground" />
          <Text>Cambiar rol</Text>
        </Button>
        <Button
          variant={usuario.isActive ? 'outline' : 'default'}
          className="flex-1 flex-row gap-1.5"
          disabled={cambiando}
          onPress={onAlternarEstado}
        >
          <Icon
            as={usuario.isActive ? UserMinus : UserCheck}
            size={15}
            className={usuario.isActive ? 'text-muted-foreground' : 'text-primary-foreground'}
          />
          <Text>{cambiando ? 'Guardando…' : usuario.isActive ? 'Desactivar' : 'Activar'}</Text>
        </Button>
      </View>
    </View>
  );
}
