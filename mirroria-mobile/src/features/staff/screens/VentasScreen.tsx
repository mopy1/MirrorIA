import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { ChevronRight, Search } from 'lucide-react-native';
import { PantallaAdmin } from '@/components/admin/PantallaAdmin';
import { Cargando, ErrorVista, Vacio } from '@/components/admin/Estados';
import { Kpi } from '@/components/admin/Kpi';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/src/hooks/useAuth';
import { formatMoney } from '@/src/lib/money';
import { staffApi } from '../api/staffApi';
import { Chips } from '../components/Chips';
import { DetalleVenta } from '../components/DetalleVenta';
import { EstadoBadge } from '../components/EstadoBadge';
import { useNombresPrendas } from '../hooks/useNombresPrendas';
import { useRecurso } from '../hooks/useRecurso';
import { codigoCorto } from '../lib/codigo';
import { canalVenta, ESTADO_VENTA, filtrarVentas, recaudado, type FiltroVentas } from '../lib/etiquetas';
import type { SucursalStaff, Venta } from '../types/staff.types';

const PERIODOS = [{ valor: '', label: 'Todo' }, { valor: 'hoy', label: 'Hoy' }, { valor: '7d', label: '7 días' }, { valor: '30d', label: '30 días' }];
const CANALES = [{ valor: '', label: 'Todos los canales' }, { valor: 'PRESENCIAL', label: 'Caja física' }, { valor: 'DIGITAL', label: 'En línea' }];
const ESTADOS = [{ valor: '', label: 'Todos los estados' }, ...Object.entries(ESTADO_VENTA).map(([valor, e]) => ({ valor, label: e.label }))];

function TarjetaVenta({ v, sucursal, onPress }: { v: Venta; sucursal: string; onPress: () => void }) {
  const e = ESTADO_VENTA[v.estado] ?? { label: v.estado, tono: 'gris' as const };
  return (
    <Pressable onPress={onPress} accessibilityRole="button" className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4 active:bg-muted">
      <View className="flex-1 gap-1">
        <View className="flex-row items-center justify-between gap-2">
          <Text className="font-mono text-sm font-semibold">{v.numeroComprobante ?? `#${codigoCorto(v.id)}`}</Text>
          <Text className="text-base font-bold">{formatMoney(v.totalCents)}</Text>
        </View>
        <Text className="text-sm text-muted-foreground" numberOfLines={1}>
          {canalVenta(v.canal)} · {sucursal} · {new Date(v.createdAt).toLocaleDateString('es-BO', { day: '2-digit', month: 'short' })}
        </Text>
        <EstadoBadge label={e.label} tono={e.tono} />
      </View>
      <Icon as={ChevronRight} size={18} className="text-muted-foreground" />
    </Pressable>
  );
}

/** `/admin/ventas`: historial de ventas presenciales y en línea, con filtros y detalle (ADMIN, ENCARGADO). */
export function VentasScreen() {
  const { user } = useAuth();
  const esAdmin = user?.role === 'ADMIN';
  const [sucursalId, setSucursalId] = useState('');
  const [f, setF] = useState<FiltroVentas>({ estado: '', canal: '', periodo: '', texto: '' });
  const [abierta, setAbierta] = useState<Venta | null>(null);
  const ventas = useRecurso(() => staffApi.ventas(sucursalId || undefined), [] as Venta[], sucursalId);
  const sucursales = useRecurso(staffApi.sucursales, [] as SucursalStaff[]);
  const nombres = useNombresPrendas();
  const nombreSucursal = (id: string) => sucursales.datos.find((s) => s.id === id)?.nombre ?? 'Sucursal';
  const visibles = useMemo(() => filtrarVentas(ventas.datos, f), [ventas.datos, f]);

  const cabecera = (
    <View className="gap-3 pb-3">
      <View className="flex-row flex-wrap gap-3">
        <Kpi titulo="Pedidos" valor={String(visibles.length)} />
        <Kpi titulo="Recaudado" valor={formatMoney(recaudado(visibles))} detalle="Solo pagadas y entregadas" />
      </View>
      <View className="justify-center">
        <Input value={f.texto} onChangeText={(texto) => setF({ ...f, texto })} placeholder="Buscar por comprobante (ej. C-3B5E)" className="pl-10" autoCapitalize="characters" />
        <Icon as={Search} size={18} className="absolute left-3 text-muted-foreground" />
      </View>
      {esAdmin && sucursales.datos.length > 1 ? (
        <Chips opciones={[{ valor: '', label: 'Todas las sucursales' }, ...sucursales.datos.map((s) => ({ valor: s.id, label: s.nombre }))]} valor={sucursalId} onCambiar={setSucursalId} />
      ) : null}
      <Chips opciones={PERIODOS} valor={f.periodo} onCambiar={(periodo) => setF({ ...f, periodo })} />
      <Chips opciones={CANALES} valor={f.canal} onCambiar={(canal) => setF({ ...f, canal })} />
      <Chips opciones={ESTADOS} valor={f.estado} onCambiar={(estado) => setF({ ...f, estado })} />
      {!esAdmin ? <Text className="text-sm text-muted-foreground">Ves las ventas de tu sucursal.</Text> : null}
    </View>
  );

  return (
    <PantallaAdmin titulo="Ventas" subtitulo="Pedidos presenciales y en línea" scroll={false}>
      <FlatList
        data={visibles}
        keyExtractor={(v) => v.id}
        ListHeaderComponent={cabecera}
        contentContainerClassName="p-4 gap-2 pb-10"
        refreshing={ventas.cargando && ventas.datos.length > 0}
        onRefresh={ventas.recargar}
        renderItem={({ item }) => (
          <TarjetaVenta v={item} sucursal={nombreSucursal(item.sucursalId)} onPress={() => { void nombres.cargar(); setAbierta(item); }} />
        )}
        ListEmptyComponent={
          ventas.cargando ? <Cargando /> : ventas.error ? <ErrorVista mensaje={ventas.error} onReintentar={ventas.recargar} />
            : <Vacio titulo="No hay ventas con estos filtros" />
        }
      />
      <DetalleVenta venta={abierta} sucursal={nombreSucursal} nombre={nombres.nombre} onCerrar={() => setAbierta(null)} />
    </PantallaAdmin>
  );
}
