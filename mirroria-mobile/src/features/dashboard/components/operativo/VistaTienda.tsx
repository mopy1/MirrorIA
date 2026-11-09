import React from 'react';
import { View } from 'react-native';
import { Store } from 'lucide-react-native';
import { Cargando, ErrorVista } from '@/components/admin/Estados';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { UsuarioRole } from '@/src/features/auth/types/auth.types';
import { fechaLarga } from '../../lib/fechas-dashboard';
import { puedeVerInventario } from '../../lib/vista-rol';
import type { DashboardOperativoDto } from '../../types/dashboard.types';
import { SelectorSucursal } from '../comun/SelectorSucursal';
import { AccesosDirectos } from './AccesosDirectos';
import { AgendaCitas } from './AgendaCitas';
import { NumerosDelDia } from './NumerosDelDia';
import { StockPorAgotarse } from './StockPorAgotarse';

interface Props {
  rol?: UsuarioRole;
  data: DashboardOperativoDto | null;
  isLoading: boolean;
  error: string | null;
  onRecargar: () => void;
  sucursalId?: string;
  onSucursal?: (id?: string) => void;
}

/** "Hoy en la tienda": lo que pasa hoy en la sucursal y qué hacer ahora. */
export function VistaTienda({ rol, data, isLoading, error, onRecargar, sucursalId, onSucursal }: Props) {
  return (
    <View className="gap-4">
      {onSucursal ? <SelectorSucursal sucursalId={sucursalId} onCambiar={onSucursal} /> : null}
      {data ? (
        <View className="flex-row flex-wrap items-center gap-1.5">
          <Icon as={Store} size={16} className="text-muted-foreground" />
          <Text className="text-sm font-medium">{data.sucursal.nombre}</Text>
          <Text className="text-sm text-muted-foreground">
            {data.sucursal.ciudad ? `· ${data.sucursal.ciudad} ` : ''}· {fechaLarga(data.fecha)}
          </Text>
        </View>
      ) : null}
      <AccesosDirectos rol={rol} />
      {error && !isLoading ? (
        <ErrorVista mensaje="No pudimos cargar lo de hoy." onReintentar={onRecargar} />
      ) : !data ? (
        <Cargando texto="Cargando lo de hoy…" />
      ) : (
        <>
          <NumerosDelDia kpis={data.kpisHoy} />
          <AgendaCitas citas={data.reservasHoy} onActualizado={onRecargar} />
          <StockPorAgotarse alertas={data.alertasStock} puedeVerInventario={puedeVerInventario(rol)} />
        </>
      )}
    </View>
  );
}
