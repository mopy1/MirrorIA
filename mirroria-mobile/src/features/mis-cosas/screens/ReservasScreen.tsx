import { Ticket } from 'phosphor-react-native';
import { PantallaProximamente } from '@/components/common/PantallaProximamente';

/** `mis-cosas/reservas` + Pase de Tienda (M3). */
export default function ReservasScreen() {
  return (
    <PantallaProximamente encabezado="Mis reservas" icono={Ticket} titulo="Tu pase de tienda"
      texto="Tus reservas con su código grande y QR para mostrar en caja, y el botón para comprar lo que reservaste."
      accion={{ texto: 'Ir a la vitrina', href: '/vitrina' }} respaldo="/mis-cosas" />
  );
}
