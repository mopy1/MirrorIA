import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { PantallaAdmin } from '@/components/admin/PantallaAdmin';
import { Cargando, ErrorVista, Vacio } from '@/components/admin/Estados';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { AvisoError } from '../components/comunes/AvisoError';
import { SoloAdmin } from '../components/comunes/SoloAdmin';
import { CuponFormHoja } from '../components/CuponFormHoja';
import { CuponTarjeta } from '../components/CuponTarjeta';
import { useCupones } from '../hooks/useCupones';

const TITULO = 'Cupones';

function Contenido() {
  const c = useCupones();
  const [creando, setCreando] = useState(false);

  const abrirAlta = () => {
    c.limpiarErrorAccion();
    setCreando(true);
  };

  return (
    <PantallaAdmin
      titulo={TITULO}
      subtitulo="Promociones y descuentos"
      recargando={c.recargando}
      onRecargar={c.recargar}
      accion={
        <Pressable onPress={abrirAlta} accessibilityLabel="Nuevo cupón" className="rounded-full bg-primary p-2">
          <Icon as={Plus} size={20} className="text-primary-foreground" />
        </Pressable>
      }
    >
      {c.cargando ? (
        <Cargando texto="Cargando cupones…" />
      ) : c.error ? (
        <ErrorVista mensaje={c.error} onReintentar={c.recargar} />
      ) : (
        <>
          <Text className="text-sm text-muted-foreground">
            {c.cupones.length} {c.cupones.length === 1 ? 'cupón registrado' : 'cupones registrados'}
          </Text>
          {!creando ? <AvisoError mensaje={c.errorAccion} /> : null}
          {c.cupones.length === 0 ? (
            <View className="gap-4">
              <Vacio
                titulo="No hay cupones registrados"
                detalle="Creá cupones de descuento porcentuales o de monto fijo para campañas y promociones de la tienda."
              />
              <Button onPress={abrirAlta}>
                <Text>Nuevo cupón</Text>
              </Button>
            </View>
          ) : (
            c.cupones.map((cupon) => (
              <CuponTarjeta
                key={cupon.id}
                cupon={cupon}
                cambiando={c.cambiandoId === cupon.id}
                onAlternar={() => c.alternarEstado(cupon.id)}
              />
            ))
          )}
        </>
      )}
      <CuponFormHoja
        visible={creando}
        guardando={c.guardando}
        error={creando ? c.errorAccion : null}
        onCerrar={() => setCreando(false)}
        onCrear={c.crear}
      />
    </PantallaAdmin>
  );
}

/** Cupones de descuento (solo ADMIN): listado, alta y activar/desactivar. */
export function CuponesScreen() {
  return (
    <SoloAdmin titulo={TITULO}>
      <Contenido />
    </SoloAdmin>
  );
}
