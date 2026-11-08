import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { Cargando, ErrorVista, Vacio } from '@/components/admin/Estados';
import { Kpi } from '@/components/admin/Kpi';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { Proveedor } from '@/src/features/admin-proveedores/types/proveedores.types';
import { esAbierta, pendientes } from '../lib/ordenes';
import type { OrdenCompra, Sucursal, VarianteConProducto } from '../types/inventario.types';
import { CancelarOrdenSheet } from './CancelarOrdenSheet';
import { OrdenCard } from './OrdenCard';
import { RecibirOrdenSheet } from './RecibirOrdenSheet';

interface Props {
  ordenes: OrdenCompra[];
  cargando: boolean;
  error: string | null;
  proveedores: Proveedor[];
  sucursales: Sucursal[];
  variantes: VarianteConProducto[];
  onNueva: () => void;
  onCambio: (aviso: string) => void;
  onReintentar: () => void;
}

/** Órdenes a proveedores (solo la dueña): abiertas primero, recibir y cancelar. */
export function OrdenesTab({ ordenes, cargando, error, proveedores, sucursales, variantes, onNueva, onCambio, onReintentar }: Props) {
  const [recibir, setRecibir] = useState<OrdenCompra | null>(null);
  const [cancelar, setCancelar] = useState<OrdenCompra | null>(null);
  const prov = (id: string) => proveedores.find((p) => p.id === id)?.razonSocial;
  const ordenadas = useMemo(
    () => [...ordenes].sort((a, b) => Number(esAbierta(b)) - Number(esAbierta(a)) || b.fechaPedido.localeCompare(a.fechaPedido)),
    [ordenes]
  );
  const abiertas = ordenes.filter(esAbierta);

  if (cargando) return <Cargando texto="Cargando órdenes…" />;
  if (error) return <ErrorVista mensaje={error} onReintentar={onReintentar} />;
  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-2">
        <Kpi titulo="Órdenes abiertas" valor={String(abiertas.length)} />
        <Kpi titulo="Unidades por llegar" valor={String(abiertas.reduce((a, o) => a + pendientes(o), 0))} />
      </View>
      <Button className="h-12" onPress={onNueva}>
        <Icon as={Plus} size={18} className="text-primary-foreground" />
        <Text>Nueva orden de compra</Text>
      </Button>
      {ordenadas.length === 0 ? (
        <Vacio titulo="Todavía no hay órdenes a proveedores" detalle="Pedí reposición desde una prenda con poco stock o con el botón de arriba." />
      ) : (
        ordenadas.map((o) => (
          <OrdenCard
            key={o.id}
            orden={o}
            proveedor={prov(o.proveedorId)}
            sucursal={sucursales.find((s) => s.id === o.sucursalDestinoId)?.nombre}
            variantes={variantes}
            onRecibir={() => setRecibir(o)}
            onCancelar={() => setCancelar(o)}
          />
        ))
      )}
      <RecibirOrdenSheet orden={recibir} variantes={variantes} onCerrar={() => setRecibir(null)} onRecibida={() => onCambio('Mercadería recibida: ya suma al stock de la sucursal.')} />
      <CancelarOrdenSheet orden={cancelar} proveedor={cancelar ? prov(cancelar.proveedorId) : undefined} onCerrar={() => setCancelar(null)} onCancelada={() => onCambio('Orden cancelada.')} />
    </View>
  );
}
