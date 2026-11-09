import { router, useLocalSearchParams } from 'expo-router';
import { CoatHanger } from 'phosphor-react-native';
import { ScrollView, View } from 'react-native';
import { EncabezadoPantalla } from '@/components/common/EncabezadoPantalla';
import { EstadoError } from '@/components/common/EstadoError';
import { EstadoVacio } from '@/components/common/EstadoVacio';
import { Pantalla } from '@/components/common/Pantalla';
import { PedirSesion } from '@/components/common/PedirSesion';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTienda } from '@/contexts/TiendaContext';
import { useEstadoRed } from '@/lib/red/use-estado-red';
import { AccionesFicha } from '../components/AccionesFicha';
import { FichaSkeleton } from '../components/FichaSkeleton';
import { GaleriaFicha } from '../components/GaleriaFicha';
import { InfoPrenda } from '../components/InfoPrenda';
import { SelectorVariante } from '../components/SelectorVariante';
import { StockPorSucursal } from '../components/StockPorSucursal';
import { useAccionesFicha } from '../hooks/use-acciones-ficha';
import { useFicha } from '../hooks/use-ficha';
import { libreTotal, useSeleccionVariante } from '../hooks/use-seleccion-variante';

/** `vitrina/[productoId]?variante=`: ficha desde SQLite con stock por sucursal; funciona en modo avión. */
export default function FichaScreen() {
  const { productoId, variante } = useLocalSearchParams<{ productoId: string; variante?: string }>();
  const { tienda } = useTienda();
  const red = useEstadoRed();
  const q = useFicha(productoId);
  const sel = useSeleccionVariante(q.data, variante);
  const acc = useAccionesFicha(productoId, q.data, sel.variante);

  let cuerpo: React.ReactNode;
  if (q.isPending) cuerpo = <FichaSkeleton />;
  else if (q.isError) cuerpo = <EstadoError error={q.error} onReintentar={() => void q.refetch()} />;
  else if (!q.data)
    cuerpo = (
      <EstadoVacio icono={CoatHanger} titulo="Esta prenda ya no está en la vitrina" texto="Puede que la tienda la haya retirado.">
        <Button onPress={() => router.navigate('/vitrina')}>
          <Text>Ir a la vitrina</Text>
        </Button>
      </EstadoVacio>
    );
  else
    cuerpo = (
      <>
        <GaleriaFicha imagenes={q.data.producto.imagenes} nombre={q.data.producto.titulo} />
        <View className="gap-7 px-5 pb-8 pt-5">
          <InfoPrenda ficha={q.data} variante={sel.variante} />
          <SelectorVariante colores={sel.colores} color={sel.color} tallas={sel.tallas} variante={sel.variante} onColor={sel.elegirColor} onTalla={sel.elegirTalla} />
          <StockPorSucursal variante={sel.variante} />
        </View>
      </>
    );

  return (
    <Pantalla>
      <EncabezadoPantalla respaldo="/vitrina" titulo={q.data?.producto.titulo} />
      <ScrollView className="flex-1">{cuerpo}</ScrollView>
      {q.data ? (
        <AccionesFicha
          precioCents={q.data.producto.precioCents}
          agotada={!sel.variante || libreTotal(sel.variante) <= 0}
          online={red.online}
          agregando={acc.agregar.isPending}
          agregada={acc.agregar.isSuccess}
          error={acc.agregar.error}
          onAgregar={acc.onAgregar}
          onReservar={acc.onReservar}
          onAvisame={acc.onAvisame}
          onProbar={() => router.navigate({ pathname: '/probador', params: { prenda: productoId } })}
          aviso={acc.aviso}
        />
      ) : null}
      <PedirSesion visible={!!acc.pedirSesion} motivo={acc.pedirSesion ?? ''} nombreTienda={tienda?.nombre ?? 'la tienda'} onCerrar={acc.cerrarPedir} />
    </Pantalla>
  );
}
