import React from 'react';
import { Linking, Pressable, View } from 'react-native';
import { Mail, Phone, Plus } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { iniciales } from '@/src/features/admin-catalogo/lib/texto';
import type { ResumenOrdenesProveedor } from '@/src/features/admin-inventario/lib/ordenes';
import type { Proveedor } from '../types/proveedores.types';

interface Props {
  proveedor: Proveedor;
  resumen?: ResumenOrdenesProveedor;
  onNuevaOrden: () => void;
}

/** Tarjeta de proveedor: datos, contacto a un toque (mail / llamada), órdenes abiertas y "Nueva orden". */
export function ProveedorCard({ proveedor: p, resumen, onNuevaOrden }: Props) {
  return (
    <View className="gap-3 rounded-2xl border border-border bg-card p-3">
      <View className="flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-primary/10">
          <Text className="text-sm font-bold text-primary">{iniciales(p.razonSocial)}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold" numberOfLines={1}>{p.razonSocial}</Text>
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {[p.contactoNombre, p.nit ? `NIT ${p.nit}` : 'Sin NIT'].filter(Boolean).join(' · ')}
          </Text>
        </View>
      </View>
      {p.contactoEmail || p.contactoTelefono ? (
        <View className="gap-1.5">
          {p.contactoEmail ? (
            <Pressable onPress={() => Linking.openURL(`mailto:${p.contactoEmail}`)} className="flex-row items-center gap-2">
              <Icon as={Mail} size={15} className="text-muted-foreground" />
              <Text className="text-xs text-primary">{p.contactoEmail}</Text>
            </Pressable>
          ) : null}
          {p.contactoTelefono ? (
            <Pressable onPress={() => Linking.openURL(`tel:${p.contactoTelefono!.replace(/\s/g, '')}`)} className="flex-row items-center gap-2">
              <Icon as={Phone} size={15} className="text-muted-foreground" />
              <Text className="text-xs text-primary">{p.contactoTelefono}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <View className="flex-row items-center gap-2 border-t border-border pt-2.5">
        <Text className="flex-1 text-xs text-muted-foreground">
          {resumen ? `${resumen.abiertas} orden${resumen.abiertas === 1 ? '' : 'es'} abierta${resumen.abiertas === 1 ? '' : 's'} · ${resumen.unidadesEnTransito} u. en camino` : 'Sin órdenes abiertas'}
        </Text>
        <Button size="sm" variant="outline" onPress={onNuevaOrden}>
          <Icon as={Plus} size={15} className="text-foreground" />
          <Text>Nueva orden</Text>
        </Button>
      </View>
    </View>
  );
}
