import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Plus, Search } from 'lucide-react-native';
import { PantallaAdmin } from '@/components/admin/PantallaAdmin';
import { Cargando, ErrorVista, Vacio } from '@/components/admin/Estados';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/src/hooks/useAuth';
import { catalogoAdminApi } from '@/src/features/admin-catalogo/api/catalogoAdminApi';
import { AvisoExito } from '@/src/features/admin-catalogo/components/form/Aviso';
import { inventarioApi } from '@/src/features/admin-inventario/api/inventarioApi';
import { CrearOrdenSheet } from '@/src/features/admin-inventario/components/CrearOrdenSheet';
import { useLista } from '@/src/features/admin-inventario/hooks/useLista';
import { resumenPorProveedor } from '@/src/features/admin-inventario/lib/ordenes';
import { proveedoresApi } from '../api/proveedoresApi';
import { ProveedorCard } from '../components/ProveedorCard';
import { ProveedorFormSheet } from '../components/ProveedorFormSheet';
import { filtrarProveedores } from '../lib/proveedor-form';

/** /admin/proveedores — solo la dueña (igual que la web): alta, listado, contacto y nueva orden de compra. */
export function ProveedoresAdminScreen() {
  const { user } = useAuth();
  const esAdmin = user?.role === 'ADMIN';
  const lista = useLista(proveedoresApi.getProveedores, esAdmin);
  const ordenes = useLista(inventarioApi.getOrdenes, esAdmin);
  const sucursales = useLista(inventarioApi.getSucursales, esAdmin);
  const colecciones = useLista(catalogoAdminApi.getColecciones, esAdmin);
  // Las variantes (un pedido por prenda) se piden recién al abrir "Nueva orden".
  const [ordenPara, setOrdenPara] = useState<string | null>(null);
  const variantes = useLista(inventarioApi.getVariantes, esAdmin && !!ordenPara);
  const [busqueda, setBusqueda] = useState('');
  const [crear, setCrear] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const resumen = useMemo(() => resumenPorProveedor(ordenes.items), [ordenes.items]);
  const filtrados = useMemo(() => filtrarProveedores(lista.items, busqueda), [lista.items, busqueda]);

  if (!esAdmin) {
    return (
      <PantallaAdmin titulo="Proveedores">
        <Vacio titulo="Solo la dueña gestiona proveedores" />
      </PantallaAdmin>
    );
  }

  return (
    <PantallaAdmin
      titulo="Proveedores"
      subtitulo={`${lista.items.length} proveedores`}
      onRecargar={() => {
        lista.recargar();
        ordenes.recargar();
      }}
      accion={
        <Button size="sm" onPress={() => setCrear(true)}>
          <Icon as={Plus} size={16} className="text-primary-foreground" />
          <Text>Nuevo</Text>
        </Button>
      }
    >
      <View className="relative justify-center">
        <View className="absolute left-3 z-10">
          <Icon as={Search} size={16} className="text-muted-foreground" />
        </View>
        <Input value={busqueda} onChangeText={setBusqueda} placeholder="Buscar por nombre, NIT o contacto…" className="pl-9" autoCorrect={false} />
      </View>
      <AvisoExito mensaje={aviso} />
      {lista.cargando ? (
        <Cargando texto="Cargando proveedores…" />
      ) : lista.error ? (
        <ErrorVista mensaje={lista.error} onReintentar={lista.recargar} />
      ) : filtrados.length === 0 ? (
        <Vacio titulo={lista.items.length ? 'Ningún proveedor coincide' : 'Todavía no hay proveedores'} detalle={lista.items.length ? undefined : 'Cargá tu primer fabricante o distribuidor con "Nuevo".'} />
      ) : (
        filtrados.map((p) => <ProveedorCard key={p.id} proveedor={p} resumen={resumen.get(p.id)} onNuevaOrden={() => setOrdenPara(p.id)} />)
      )}

      <ProveedorFormSheet
        visible={crear}
        onCerrar={() => setCrear(false)}
        onCreado={(p) => {
          setAviso(`Proveedor "${p.razonSocial}" creado.`);
          lista.recargar();
        }}
      />
      <CrearOrdenSheet
        visible={!!ordenPara && !variantes.cargando}
        onCerrar={() => setOrdenPara(null)}
        proveedores={lista.items}
        sucursales={sucursales.items.filter((s) => s.activo)}
        variantes={variantes.items}
        colecciones={colecciones.items}
        inicial={{ proveedorId: ordenPara ?? undefined }}
        onCreada={() => {
          setAviso('Orden de compra creada: la ves y la recibís en Inventario › Órdenes.');
          ordenes.recargar();
        }}
      />
    </PantallaAdmin>
  );
}
