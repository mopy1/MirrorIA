import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { PantallaAdmin } from '@/components/admin/PantallaAdmin';
import { Cargando, ErrorVista, Vacio } from '@/components/admin/Estados';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { AvisoError } from '@/src/features/admin-cupones/components/comunes/AvisoError';
import { SoloAdmin } from '@/src/features/admin-cupones/components/comunes/SoloAdmin';
import { CiudadesLista } from '../components/CiudadesLista';
import { SucursalFormHoja } from '../components/SucursalFormHoja';
import { SucursalTarjeta } from '../components/SucursalTarjeta';
import { useSucursalesAdmin } from '../hooks/useSucursalesAdmin';

const TITULO = 'Sucursales';
type Pestana = 'sucursales' | 'ciudades';

function Pestanas({ valor, onCambiar }: { valor: Pestana; onCambiar: (p: Pestana) => void }) {
  const items: { id: Pestana; label: string }[] = [
    { id: 'sucursales', label: 'Sucursales' },
    { id: 'ciudades', label: 'Ciudades' },
  ];
  return (
    <View className="flex-row rounded-xl bg-muted p-1">
      {items.map((i) => (
        <Pressable
          key={i.id}
          onPress={() => onCambiar(i.id)}
          accessibilityRole="tab"
          accessibilityState={{ selected: valor === i.id }}
          className={cn('flex-1 items-center rounded-lg py-2', valor === i.id && 'bg-background shadow-sm')}
        >
          <Text className={cn('text-sm font-medium', valor === i.id ? 'text-foreground' : 'text-muted-foreground')}>
            {i.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function Contenido() {
  const s = useSucursalesAdmin();
  const [pestana, setPestana] = useState<Pestana>('sucursales');
  const [creando, setCreando] = useState(false);

  const abrirAlta = () => {
    s.limpiarErrorAlta();
    setCreando(true);
  };

  return (
    <PantallaAdmin
      titulo={TITULO}
      subtitulo="Ciudades y tiendas físicas"
      recargando={s.recargando}
      onRecargar={s.recargar}
      accion={
        <Pressable onPress={abrirAlta} accessibilityLabel="Nueva sucursal" className="rounded-full bg-primary p-2">
          <Icon as={Plus} size={20} className="text-primary-foreground" />
        </Pressable>
      }
    >
      <Pestanas valor={pestana} onCambiar={setPestana} />
      {s.cargando ? (
        <Cargando texto="Cargando sucursales…" />
      ) : s.error ? (
        <ErrorVista mensaje={s.error} onReintentar={s.recargar} />
      ) : pestana === 'ciudades' ? (
        <CiudadesLista ciudades={s.ciudades} sucursales={s.sucursales} />
      ) : (
        <>
          <Text className="text-sm text-muted-foreground">
            {s.sucursales.length} {s.sucursales.length === 1 ? 'sucursal' : 'sucursales'}
          </Text>
          {s.sucursales.length === 0 ? (
            <Vacio titulo="Todavía no hay sucursales" detalle="Abrí tu primera tienda física para manejar su inventario." />
          ) : (
            s.sucursales.map((suc) => <SucursalTarjeta key={suc.id} sucursal={suc} />)
          )}
          <Button variant="outline" onPress={abrirAlta}>
            <Text>Nueva sucursal</Text>
          </Button>
        </>
      )}
      {!creando ? <AvisoError mensaje={s.errorAlta} /> : null}
      <SucursalFormHoja
        visible={creando}
        ciudades={s.ciudades}
        guardando={s.guardando}
        error={s.errorAlta}
        onCerrar={() => setCreando(false)}
        onCrear={s.crear}
      />
    </PantallaAdmin>
  );
}

/** Sucursales (solo ADMIN): listado, alta con ciudad global y el límite del plan. */
export function SucursalesScreen() {
  return (
    <SoloAdmin titulo={TITULO}>
      <Contenido />
    </SoloAdmin>
  );
}
