import { useLocalSearchParams } from 'expo-router';
import { CalendarCheck } from 'phosphor-react-native';
import { PantallaProximamente } from '@/components/common/PantallaProximamente';

/** `vitrina/[productoId]/reservar` (CU09/CU10, se construye en M3). */
export default function ReservarScreen() {
  const { productoId } = useLocalSearchParams<{ productoId: string }>();
  return (
    <PantallaProximamente
      encabezado="Reservar para probarme"
      icono={CalendarCheck}
      titulo="Reservá tu talla en la sucursal"
      texto="Elegí sucursal y hora, y la prenda te espera apartada. Si no tenés red, la reserva se envía sola cuando vuelva."
      accion={{ texto: 'Volver a la prenda', href: `/vitrina/${productoId}` }}
      respaldo={`/vitrina/${productoId}`}
    />
  );
}
