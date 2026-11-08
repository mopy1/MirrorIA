import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { CircleCheck, CloudUpload, Search, Ticket, X } from 'lucide-react-native';
import { PantallaAdmin } from '@/components/admin/PantallaAdmin';
import { Cargando, ErrorVista, Vacio } from '@/components/admin/Estados';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/src/hooks/useAuth';
import { tiendaActual } from '@/src/lib/api';
import { formatMoney } from '@/src/lib/money';
import { Aviso } from '@/src/features/staff/components/Aviso';
import { Chips } from '@/src/features/staff/components/Chips';
import { AvisosFallidas } from '../components/AvisosFallidas';
import { EstadoCaja } from '../components/EstadoCaja';
import { HojaReservas } from '../components/HojaReservas';
import { HojaVenta } from '../components/HojaVenta';
import { TarjetaPrenda } from '../components/TarjetaPrenda';
import { useMostrador } from '../hooks/useMostrador';
import { useReservasCaja } from '../hooks/useReservasCaja';
import { useVentaActual } from '../hooks/useVentaActual';
import { correrSincronizacionCaja } from '../lib/correr-sincronizacion';
import { filtrarCatalogo, totalCents, unidades } from '../lib/venta-caja';

type Resultado = { tipo: 'ok' | 'cola'; texto: string } | null;

/** `/admin/mostrador`: venta en caja. Sigue funcionando sin internet (cola en SQLite). */
export function MostradorScreen() {
  const { user } = useAuth();
  const m = useMostrador();
  const { reservas, recargar: recargarReservas } = useReservasCaja(m.sucursalId, m.enLinea);
  const v = useVentaActual(m.catalogo, m.vendido);
  const { reserva: reservaParam } = useLocalSearchParams<{ reserva?: string }>();
  const [busqueda, setBusqueda] = useState('');
  const [hoja, setHoja] = useState<'venta' | 'reservas' | null>(null);
  const [cobrando, setCobrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado>(null);
  const [enviando, setEnviando] = useState(false);
  const reservaUsada = useRef<string | null>(null);

  const visibles = useMemo(() => filtrarCatalogo(m.catalogo, busqueda), [m.catalogo, busqueda]);

  // Llegó desde Reservas con «Cobrar en caja»: se carga esa reserva una vez.
  useEffect(() => {
    if (!reservaParam || reservaUsada.current === reservaParam || m.catalogo.length === 0) return;
    const r = reservas.find((x) => x.id === reservaParam);
    if (!r) return;
    reservaUsada.current = reservaParam;
    v.cobrarReserva(r);
    setHoja('venta');
  }, [reservaParam, reservas, m.catalogo.length, v]);

  async function cobrar() {
    setCobrando(true);
    setError(null);
    try {
      const r = await m.vender(v.lineas, v.clienta);
      setResultado(
        r.estado === 'REGISTRADA'
          ? { tipo: 'ok', texto: `Venta registrada${r.venta.numeroComprobante ? ` · ${r.venta.numeroComprobante}` : ''}.` }
          : { tipo: 'cola', texto: 'Venta guardada en este teléfono. Se envía sola al volver internet.' },
      );
      v.limpiar();
      setHoja(null);
      if (r.estado === 'REGISTRADA') void recargarReservas();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo registrar la venta');
    } finally {
      setCobrando(false);
    }
  }

  async function enviarAhora() {
    if (!user) return;
    setEnviando(true);
    try {
      await correrSincronizacionCaja({ tienda: tiendaActual(), usuarioId: user.id });
      await m.recargar();
    } finally {
      setEnviando(false);
    }
  }

  const cabecera = (
    <View className="gap-3 pb-3">
      <EstadoCaja
        enLinea={m.enLinea} guardaSinRed={m.guardaSinRed} delTelefono={m.delTelefono} vencida={m.vencida} fotoGuardadaEn={m.fotoGuardadaEn}
        pendientes={m.pendientes.length} enviando={enviando} onEnviar={enviarAhora}
      />
      <AvisosFallidas fallidas={m.fallidas} onAtender={m.atender} />
      {resultado ? (
        <Aviso tono={resultado.tipo === 'ok' ? 'ok' : 'info'} icono={resultado.tipo === 'ok' ? CircleCheck : CloudUpload}>
          {resultado.texto}
        </Aviso>
      ) : null}
      {m.debeElegirSucursal && m.sucursales.length > 1 ? (
        <Chips
          opciones={m.sucursales.map((s) => ({ valor: s.id, label: s.nombre }))}
          valor={m.sucursalId ?? ''}
          onCambiar={(id) => { m.elegirSucursal(id); v.limpiar(); }}
        />
      ) : null}
      {v.clienta ? (
        <View className="flex-row items-center gap-2 rounded-xl border border-primary/40 bg-primary/5 px-3 py-2">
          <Icon as={Ticket} size={18} className="text-primary" />
          <Text className="flex-1 text-sm">Cobrando la reserva <Text className="font-mono font-semibold">#{v.clienta.codigo}</Text></Text>
          <Pressable onPress={v.limpiar} accessibilityLabel="Quitar la reserva" className="h-9 w-9 items-center justify-center">
            <Icon as={X} size={18} className="text-muted-foreground" />
          </Pressable>
        </View>
      ) : (
        <Button variant="outline" onPress={() => setHoja('reservas')} className="self-start">
          <Icon as={Ticket} size={16} className="text-foreground" />
          <Text>{`Cobrar una reserva${reservas.length ? ` (${reservas.length})` : ''}`}</Text>
        </Button>
      )}
      <View className="justify-center">
        <Input value={busqueda} onChangeText={setBusqueda} placeholder="Buscar por nombre, talla, color o SKU" className="pl-10" accessibilityLabel="Buscar prenda" />
        <Icon as={Search} size={18} className="absolute left-3 text-muted-foreground" />
      </View>
    </View>
  );

  const n = unidades(v.lineas);
  return (
    <PantallaAdmin titulo="Mostrador" subtitulo="Vendé en caja, con o sin internet" scroll={false}>
      <FlatList
        data={visibles}
        keyExtractor={(i) => i.varianteId}
        ListHeaderComponent={cabecera}
        contentContainerClassName="p-4 gap-2 pb-32"
        keyboardShouldPersistTaps="handled"
        refreshing={m.cargando && m.catalogo.length > 0}
        onRefresh={() => { void m.recargar(); void recargarReservas(); }}
        renderItem={({ item }) => (
          <TarjetaPrenda item={item} disponible={v.disponible(item)} enVenta={v.enVenta(item.varianteId)} onAgregar={() => v.agregar(item)} />
        )}
        ListEmptyComponent={
          m.cargando ? <Cargando texto="Cargando el stock de la sucursal…" />
            : m.error ? <ErrorVista mensaje={m.error} onReintentar={m.recargar} />
            : <Vacio titulo="No hay prendas para mostrar" detalle={busqueda ? 'Probá con otra búsqueda.' : undefined} />
        }
      />
      {n > 0 ? (
        <View className="absolute bottom-0 left-0 right-0 border-t border-border bg-background p-4">
          <Button size="lg" className="h-14 justify-between px-5" onPress={() => { setError(null); setHoja('venta'); }}>
            <Text className="text-base">{n} {n === 1 ? 'prenda' : 'prendas'} · {formatMoney(totalCents(v.lineas))}</Text>
            <Text className="text-base font-semibold">Cobrar</Text>
          </Button>
        </View>
      ) : null}
      <HojaVenta
        visible={hoja === 'venta'} lineas={v.lineas} clienta={v.clienta} maximo={v.maximo} enLinea={m.enLinea}
        cobrando={cobrando} error={error} onSumar={(l) => v.agregar(l.item)} onRestar={v.restar} onQuitar={v.quitar}
        onCobrar={cobrar} onCerrar={() => setHoja(null)}
      />
      <HojaReservas
        visible={hoja === 'reservas'} reservas={reservas} onCerrar={() => setHoja(null)}
        onElegir={(r) => {
          const faltan = v.cobrarReserva(r);
          setError(faltan ? `${faltan} prenda(s) de la reserva ya no están a la venta en esta sucursal.` : null);
          setHoja('venta');
        }}
      />
    </PantallaAdmin>
  );
}
