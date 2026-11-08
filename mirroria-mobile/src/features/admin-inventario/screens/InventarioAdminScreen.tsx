import React, { useState } from 'react';
import { View } from 'react-native';
import { PantallaAdmin } from '@/components/admin/PantallaAdmin';
import { Cargando, ErrorVista, Vacio } from '@/components/admin/Estados';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/src/hooks/useAuth';
import { catalogoAdminApi } from '@/src/features/admin-catalogo/api/catalogoAdminApi';
import { AvisoExito } from '@/src/features/admin-catalogo/components/form/Aviso';
import { SelectorChips } from '@/src/features/admin-catalogo/components/form/SelectorChips';
import { proveedoresApi } from '@/src/features/admin-proveedores/api/proveedoresApi';
import { inventarioApi } from '../api/inventarioApi';
import { AjusteSheet } from '../components/AjusteSheet';
import { CrearOrdenSheet, type OrdenInicial } from '../components/CrearOrdenSheet';
import { MovimientosLista } from '../components/MovimientosLista';
import { OrdenesTab } from '../components/OrdenesTab';
import { Pestanas } from '../components/Pestanas';
import { StockTab } from '../components/StockTab';
import { useLista } from '../hooks/useLista';
import { useStockSucursal } from '../hooks/useStockSucursal';

type Vista = 'stock' | 'movimientos' | 'ordenes';

/** /admin/inventario — dueña y encargada (esta solo su sucursal). Órdenes a proveedores: solo la dueña, como en la web. */
export function InventarioAdminScreen() {
  const { user } = useAuth();
  const puede = user?.role === 'ADMIN' || user?.role === 'ENCARGADO_SUCURSAL';
  const esAdmin = user?.role === 'ADMIN';
  const st = useStockSucursal(puede, user?.role, user?.sucursalId);
  const movs = useLista(() => inventarioApi.getMovimientos({ sucursalId: st.sucursalId }), puede && !!st.sucursalId, [st.sucursalId]);
  const ordenes = useLista(inventarioApi.getOrdenes, esAdmin);
  const proveedores = useLista(proveedoresApi.getProveedores, esAdmin);
  const colecciones = useLista(catalogoAdminApi.getColecciones, esAdmin);
  const [vista, setVista] = useState<Vista>('stock');
  const [ajuste, setAjuste] = useState<{ varianteId?: string } | null>(null);
  const [pedido, setPedido] = useState<OrdenInicial | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  if (!puede) {
    return (
      <PantallaAdmin titulo="Inventario">
        <Vacio titulo="El inventario lo gestionan la dueña y las encargadas" />
      </PantallaAdmin>
    );
  }

  const refrescar = () => {
    st.refrescarStock();
    movs.recargar();
    if (esAdmin) ordenes.recargar();
  };
  const sucursal = st.sucursales.find((s) => s.id === st.sucursalId);

  return (
    <PantallaAdmin
      titulo="Inventario"
      subtitulo={sucursal ? `${sucursal.nombre} · ${sucursal.ciudadNombre}` : 'Stock por sucursal'}
      recargando={false}
      onRecargar={() => {
        st.recargarTodo();
        movs.recargar();
        if (esAdmin) ordenes.recargar();
      }}
    >
      {st.cargando ? (
        <Cargando texto="Cargando inventario…" />
      ) : st.error && st.sucursales.length === 0 ? (
        <ErrorVista mensaje={st.error} onReintentar={st.recargarTodo} />
      ) : st.sucursales.length === 0 ? (
        <Vacio titulo="No tenés una sucursal asignada" detalle="Pedile a la dueña que te asigne una sucursal." />
      ) : (
        <>
          {st.sucursales.length > 1 ? (
            <SelectorChips opciones={st.sucursales.map((s) => ({ value: s.id, label: s.nombre, detalle: s.ciudadNombre }))} valor={st.sucursalId} onCambiar={st.setSucursalId} enFila />
          ) : null}
          <Pestanas
            items={[
              { id: 'stock', label: 'Stock' },
              { id: 'movimientos', label: 'Movimientos' },
              ...(esAdmin ? [{ id: 'ordenes' as const, label: 'Órdenes' }] : []),
            ]}
            valor={vista}
            onCambiar={setVista}
          />
          <AvisoExito mensaje={aviso} />
          {vista === 'stock' ? (
            <StockTab
              filas={st.filas}
              variantes={st.variantes}
              cargando={st.cargandoStock}
              onAjustar={(varianteId) => setAjuste({ varianteId })}
              onPedir={esAdmin ? (varianteId) => setPedido({ varianteId, sucursalId: st.sucursalId }) : undefined}
            />
          ) : vista === 'movimientos' ? (
            movs.cargando ? (
              <Cargando texto="Cargando movimientos…" />
            ) : movs.items.length === 0 ? (
              <Vacio titulo="Sin movimientos en esta sucursal" />
            ) : (
              <View className="gap-2">
                <Text className="text-xs text-muted-foreground">Últimos {Math.min(60, movs.items.length)} de {movs.items.length} movimientos</Text>
                <MovimientosLista movimientos={movs.items.slice(0, 60)} variantes={st.variantes} />
              </View>
            )
          ) : (
            <OrdenesTab
              ordenes={ordenes.items}
              cargando={ordenes.cargando}
              error={ordenes.error}
              proveedores={proveedores.items}
              sucursales={st.sucursales}
              variantes={st.variantes}
              onNueva={() => setPedido({ sucursalId: st.sucursalId })}
              onCambio={(m) => {
                setAviso(m);
                refrescar();
              }}
              onReintentar={ordenes.recargar}
            />
          )}
        </>
      )}

      <AjusteSheet
        visible={!!ajuste}
        onCerrar={() => setAjuste(null)}
        variantes={st.variantes}
        sucursales={st.sucursales}
        filas={st.filas}
        inicial={{ varianteId: ajuste?.varianteId, sucursalId: st.sucursalId }}
        onAjustado={(m) => {
          setAviso(m);
          refrescar();
        }}
      />
      {esAdmin ? (
        <CrearOrdenSheet
          visible={!!pedido}
          onCerrar={() => setPedido(null)}
          proveedores={proveedores.items}
          sucursales={st.sucursales}
          variantes={st.variantes}
          colecciones={colecciones.items}
          inicial={pedido ?? {}}
          onCreada={() => {
            setAviso('Orden de compra creada: las prendas figuran "en camino" hasta que las recibas.');
            refrescar();
          }}
        />
      ) : null}
    </PantallaAdmin>
  );
}
