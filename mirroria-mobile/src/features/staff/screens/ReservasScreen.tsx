import React, { useEffect, useMemo, useState } from 'react';
import { SectionList, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { CircleAlert, Search } from 'lucide-react-native';
import { PantallaAdmin } from '@/components/admin/PantallaAdmin';
import { Cargando, ErrorVista, Vacio } from '@/components/admin/Estados';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/src/hooks/useAuth';
import { ApiError } from '@/src/lib/api';
import { staffApi } from '../api/staffApi';
import { Aviso } from '../components/Aviso';
import { Chips } from '../components/Chips';
import { TarjetaReserva } from '../components/TarjetaReserva';
import { useNombresPrendas } from '../hooks/useNombresPrendas';
import { useRecurso } from '../hooks/useRecurso';
import { agruparPorDia, filtrarReservas, tituloDia } from '../lib/agenda';
import { coincideCodigo } from '../lib/codigo';
import { ESTADO_RESERVA } from '../lib/etiquetas';
import type { Reserva, SucursalStaff } from '../types/staff.types';

const FILTROS = [{ valor: 'ACTIVAS', label: 'Activas' }, { valor: '', label: 'Todas' }, ...Object.entries(ESTADO_RESERVA).map(([valor, e]) => ({ valor, label: e.label }))];

/** `/admin/reservas`: agenda de citas para probarse en tienda, con las mismas transiciones que la web. */
export function ReservasScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const esAdmin = user?.role === 'ADMIN';
  const puedeCobrar = user?.role === 'ADMIN' || user?.role === 'CAJERO';
  const [sucursalId, setSucursalId] = useState('');
  const [filtro, setFiltro] = useState('ACTIVAS');
  const [codigo, setCodigo] = useState('');
  const [ocupada, setOcupada] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reservas = useRecurso(() => staffApi.reservas({ sucursalId: sucursalId || undefined }), [] as Reserva[], sucursalId);
  const sucursales = useRecurso(staffApi.sucursales, [] as SucursalStaff[]);
  const nombres = useNombresPrendas();
  const cargarNombres = nombres.cargar;
  useEffect(() => { void cargarNombres(); }, [cargarNombres]);

  const secciones = useMemo(
    () => agruparPorDia(filtrarReservas(reservas.datos, filtro).filter((r) => coincideCodigo(r.id, codigo))),
    [reservas.datos, filtro, codigo],
  );
  const nombreSucursal = (id: string) => sucursales.datos.find((s) => s.id === id)?.nombre ?? null;
  const suSucursal = nombreSucursal(user?.sucursalId ?? '');

  async function cambiar(id: string, estado: string) {
    setOcupada(id);
    setError(null);
    try {
      const nueva = await staffApi.cambiarEstadoReserva(id, estado);
      reservas.setDatos((a) => a.map((r) => (r.id === id ? nueva : r)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo cambiar el estado');
      void reservas.recargar();
    } finally {
      setOcupada(null);
    }
  }

  const cabecera = (
    <View className="gap-3 pb-1">
      <View className="justify-center">
        <Input value={codigo} onChangeText={setCodigo} placeholder="Código de la clienta (ej. D6018924)" autoCapitalize="characters" className="pl-10" accessibilityLabel="Buscar reserva por código" />
        <Icon as={Search} size={18} className="absolute left-3 text-muted-foreground" />
      </View>
      {esAdmin && sucursales.datos.length > 1 ? (
        <Chips opciones={[{ valor: '', label: 'Todas las sucursales' }, ...sucursales.datos.map((s) => ({ valor: s.id, label: s.nombre }))]} valor={sucursalId} onCambiar={setSucursalId} />
      ) : !esAdmin ? (
        <Text className="text-sm text-muted-foreground">Sucursal: {suSucursal ?? 'la tuya'}</Text>
      ) : null}
      <Chips opciones={FILTROS} valor={filtro} onCambiar={setFiltro} />
      {error ? <Aviso tono="error" icono={CircleAlert}>{error}</Aviso> : null}
    </View>
  );

  return (
    <PantallaAdmin titulo="Reservas" subtitulo="Citas para probarse prendas en tienda" scroll={false}>
      <SectionList
        sections={secciones}
        keyExtractor={(r) => r.id}
        ListHeaderComponent={cabecera}
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 8 }}
        keyboardShouldPersistTaps="handled"
        stickySectionHeadersEnabled={false}
        refreshing={reservas.cargando && reservas.datos.length > 0}
        onRefresh={reservas.recargar}
        renderSectionHeader={({ section }) => (
          <Text className="pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {tituloDia(section.dia)} · {section.data.length}
          </Text>
        )}
        renderItem={({ item }) => (
          <TarjetaReserva
            reserva={item}
            sucursal={esAdmin ? nombreSucursal(item.sucursalId) : null}
            nombre={nombres.nombre}
            ocupada={ocupada === item.id}
            puedeCobrar={puedeCobrar}
            onCambiar={(estado) => cambiar(item.id, estado)}
            onCobrar={() => router.push(`/admin/mostrador?reserva=${item.id}` as Href)}
          />
        )}
        ListEmptyComponent={
          reservas.cargando ? <Cargando /> : reservas.error ? <ErrorVista mensaje={reservas.error} onReintentar={reservas.recargar} />
            : <Vacio titulo="No hay reservas que coincidan" detalle={filtro === 'ACTIVAS' ? 'Probá con «Todas».' : undefined} />
        }
      />
    </PantallaAdmin>
  );
}
