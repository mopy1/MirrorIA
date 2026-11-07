import { CheckCircle } from 'phosphor-react-native';
import { ScrollView } from 'react-native';
import { EncabezadoPantalla } from '@/components/common/EncabezadoPantalla';
import { EstadoVacio } from '@/components/common/EstadoVacio';
import { Pantalla } from '@/components/common/Pantalla';
import { InterruptorSinRed } from '../components/InterruptorSinRed';

/** `mis-cosas/pendientes`: estado de red + modo demo. La lista de la outbox llega en M2. */
export default function PendientesScreen() {
  return (
    <Pantalla>
      <EncabezadoPantalla titulo="Pendientes de enviar" respaldo="/mis-cosas" />
      <ScrollView contentContainerClassName="pt-2 pb-10">
        <InterruptorSinRed />
        <EstadoVacio
          icono={CheckCircle}
          titulo="Todo enviado"
          texto="Lo que hagas sin red (agregar al carrito, comprar, reservar) va a esperar acá y se envía solo cuando vuelva la conexión."
        />
      </ScrollView>
    </Pantalla>
  );
}
