import React, { useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Pencil, Plus } from 'lucide-react-native';
import { PantallaAdmin } from '@/components/admin/PantallaAdmin';
import { Cargando, ErrorVista, Vacio } from '@/components/admin/Estados';
import { Seccion } from '@/components/admin/Seccion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/src/hooks/useAuth';
import { formatMoney } from '@/src/lib/money';
import { ConfirmarEstadoSheet } from '../components/ConfirmarEstadoSheet';
import { ProductoFormSheet } from '../components/ProductoFormSheet';
import { VarianteFormSheet } from '../components/VarianteFormSheet';
import { VariantesLista } from '../components/VariantesLista';
import { useActivarPrenda } from '../hooks/useActivarPrenda';
import { useProductoAdmin } from '../hooks/useProductoAdmin';

/** /admin/catalogo/[id] — ficha de la prenda: datos, fotos, variantes, editar y activar/desactivar. */
export function ProductoAdminScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const esAdmin = user?.role === 'ADMIN';
  const d = useProductoAdmin(id, esAdmin);
  const activar = useActivarPrenda(d.recargar);
  const [editar, setEditar] = useState(false);
  const [variante, setVariante] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const p = d.producto;

  if (!esAdmin) {
    return (
      <PantallaAdmin titulo="Prenda">
        <Vacio titulo="Solo la dueña gestiona el catálogo" />
      </PantallaAdmin>
    );
  }
  if (d.cargando || !p) {
    return (
      <PantallaAdmin titulo="Prenda">
        {d.error ? <ErrorVista mensaje={d.error} onReintentar={d.recargar} /> : <Cargando />}
      </PantallaAdmin>
    );
  }

  const fotos = [...p.imagenes].sort((a, b) => a.orden - b.orden);
  const categoria = d.categorias.find((c) => c.id === p.categoriaId)?.nombre;
  const coleccion = d.colecciones.find((c) => c.id === p.coleccionId);
  const temporada = d.temporadas.find((t) => t.id === coleccion?.temporadaId)?.nombre;

  return (
    <PantallaAdmin titulo={p.titulo} subtitulo={p.slug} recargando={d.recargando} onRecargar={d.recargar}>
      {fotos.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          {fotos.map((f, i) => (
            <Image key={`${f.url}-${i}`} source={{ uri: f.url }} className="h-48 w-36 rounded-2xl bg-muted" resizeMode="cover" />
          ))}
        </ScrollView>
      ) : null}

      <View className="gap-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-2xl font-bold text-primary">{formatMoney(p.precioCents)}</Text>
          {p.activo ? <Badge variant="success" label="Activa" /> : <Badge variant="outline" label="Desactivada" />}
        </View>
        <Text className="text-sm text-muted-foreground">
          {[categoria, coleccion?.nombre, temporada].filter(Boolean).join(' · ')}
        </Text>
        {p.descripcion ? <Text className="text-sm mt-1">{p.descripcion}</Text> : null}
      </View>

      <Button variant="outline" className="h-12" onPress={() => setEditar(true)}>
        <Icon as={Pencil} size={16} className="text-foreground" />
        <Text>Editar datos, precio y fotos</Text>
      </Button>

      <Seccion
        titulo={`Variantes (${p.variantes?.length ?? 0})`}
        accion={
          <Button size="sm" onPress={() => setVariante(true)}>
            <Icon as={Plus} size={16} className="text-primary-foreground" />
            <Text>Variante</Text>
          </Button>
        }
      >
        <VariantesLista variantes={p.variantes ?? []} colores={d.colores} />
      </Seccion>

      <Button variant={p.activo ? 'ghost' : 'default'} className="h-12" onPress={() => { activar.limpiarError(); setConfirmar(true); }}>
        <Text className={p.activo ? 'text-destructive' : undefined}>{p.activo ? 'Desactivar prenda' : 'Reactivar prenda'}</Text>
      </Button>

      <ProductoFormSheet
        visible={editar}
        onCerrar={() => setEditar(false)}
        producto={p}
        categorias={d.categorias}
        colecciones={d.colecciones}
        temporadas={d.temporadas}
        onGuardado={d.recargar}
      />
      <VarianteFormSheet visible={variante} onCerrar={() => setVariante(false)} producto={p} tallas={d.tallas} colores={d.colores} onCreada={d.recargar} />
      <ConfirmarEstadoSheet
        visible={confirmar}
        activa={p.activo}
        titulo={p.titulo}
        ocupado={activar.ocupado === p.id}
        error={activar.error}
        onCerrar={() => setConfirmar(false)}
        onConfirmar={async () => {
          if (await activar.cambiar(p.id, !p.activo)) setConfirmar(false);
        }}
      />
    </PantallaAdmin>
  );
}
