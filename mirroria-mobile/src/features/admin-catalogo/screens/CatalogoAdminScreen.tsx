import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { PantallaAdmin } from '@/components/admin/PantallaAdmin';
import { Cargando, ErrorVista, Vacio } from '@/components/admin/Estados';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/src/hooks/useAuth';
import { AvisoError } from '../components/form/Aviso';
import { CatalogoFiltros } from '../components/CatalogoFiltros';
import { ProductoCard } from '../components/ProductoCard';
import { ProductoFormSheet } from '../components/ProductoFormSheet';
import { useActivarPrenda } from '../hooks/useActivarPrenda';
import { useCatalogoAdmin } from '../hooks/useCatalogoAdmin';
import { filtrarProductos } from '../lib/producto-form';
import { resumenPlan } from '../lib/uso-plan';

/** /admin/catalogo — prendas de la tienda (solo la dueña, igual que la web). */
export function CatalogoAdminScreen() {
  const { user } = useAuth();
  const esAdmin = user?.role === 'ADMIN';
  const router = useRouter();
  const cat = useCatalogoAdmin(esAdmin);
  const activar = useActivarPrenda(cat.recargar);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('TODAS');
  const [crear, setCrear] = useState(false);
  // Al volver de la ficha de una prenda (editada, desactivada…) se refresca la lista.
  const primeraVez = useRef(true);
  const { recargar } = cat;
  useFocusEffect(
    useCallback(() => {
      if (primeraVez.current) primeraVez.current = false;
      else if (esAdmin) recargar();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [esAdmin])
  );

  const filtrados = useMemo(() => filtrarProductos(cat.productos, busqueda, categoria), [cat.productos, busqueda, categoria]);
  const nombreCategoria = (id: string) => cat.categorias.find((c) => c.id === id)?.nombre;
  const nombreColeccion = (id: string) => cat.colecciones.find((c) => c.id === id)?.nombre;
  const plan = resumenPlan(cat.uso, cat.productos.length);
  const abrir = (id: string) => router.push(`/admin/catalogo/${id}` as Href);

  if (!esAdmin) {
    return (
      <PantallaAdmin titulo="Catálogo">
        <Vacio titulo="Solo la dueña gestiona el catálogo" detalle="Pedile a la administradora de la tienda que cargue o cambie prendas." />
      </PantallaAdmin>
    );
  }

  return (
    <PantallaAdmin
      titulo="Catálogo"
      subtitulo={plan.texto}
      recargando={cat.recargando}
      onRecargar={cat.recargar}
      accion={
        <Button size="sm" onPress={() => setCrear(true)} accessibilityLabel="Nueva prenda">
          <Icon as={Plus} size={16} className="text-primary-foreground" />
          <Text>Nueva</Text>
        </Button>
      }
    >
      {plan.lleno || plan.casiLleno ? (
        <View className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
          <Text className="text-sm text-amber-800">
            {plan.lleno
              ? 'Llegaste al tope de prendas activas de tu plan. Desactivá alguna o mejorá el plan para cargar más.'
              : 'Te queda un solo lugar para prendas activas en tu plan.'}
          </Text>
        </View>
      ) : null}
      <CatalogoFiltros busqueda={busqueda} onBuscar={setBusqueda} categoria={categoria} onCategoria={setCategoria} categorias={cat.categorias} />
      <AvisoError mensaje={activar.error} />

      {cat.cargando ? (
        <Cargando texto="Cargando prendas…" />
      ) : cat.error ? (
        <ErrorVista mensaje={cat.error} onReintentar={cat.recargar} />
      ) : filtrados.length === 0 ? (
        cat.productos.length > 0 ? (
          <Vacio titulo="Ninguna prenda coincide con la búsqueda" detalle='Probá con otro nombre o elegí "Todas".' />
        ) : (
          <View className="items-center gap-3">
            <Vacio titulo="Todavía no cargaste prendas" detalle="Ya tenés tallas, colores, categorías y una colección inicial listas: solo falta tu primera prenda." />
            <Button variant="outline" onPress={() => setCrear(true)}>
              <Text>Cargar mi primera prenda</Text>
            </Button>
          </View>
        )
      ) : (
        <View className="gap-2.5">
          <Text className="text-xs text-muted-foreground">{filtrados.length} de {cat.productos.length} prendas</Text>
          {filtrados.map((p) => (
            <ProductoCard key={p.id} producto={p} categoria={nombreCategoria(p.categoriaId)} coleccion={nombreColeccion(p.coleccionId)} onAbrir={() => abrir(p.id)} />
          ))}
        </View>
      )}

      {cat.inactivas.length > 0 ? (
        <View className="gap-2.5 pt-2">
          <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Desactivadas (no se venden)</Text>
          {cat.inactivas.map((p) => (
            <ProductoCard
              key={p.id}
              producto={p}
              categoria={nombreCategoria(p.categoriaId)}
              coleccion={nombreColeccion(p.coleccionId)}
              onAbrir={() => abrir(p.id)}
              onReactivar={() => activar.cambiar(p.id, true)}
              reactivando={activar.ocupado === p.id}
            />
          ))}
        </View>
      ) : null}

      <ProductoFormSheet
        visible={crear}
        onCerrar={() => setCrear(false)}
        categorias={cat.categorias}
        colecciones={cat.colecciones}
        temporadas={cat.temporadas}
        onGuardado={(p) => {
          cat.recargar();
          abrir(p.id);
        }}
      />
    </PantallaAdmin>
  );
}
