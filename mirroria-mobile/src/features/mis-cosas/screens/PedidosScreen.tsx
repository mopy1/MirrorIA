import { Receipt } from 'phosphor-react-native';
import { PantallaProximamente } from '@/components/common/PantallaProximamente';

/** `mis-cosas/pedidos` (M3). */
export default function PedidosScreen() {
  return (
    <PantallaProximamente encabezado="Mis pedidos" icono={Receipt} titulo="Tus compras, como un recibo"
      texto="Vas a ver cada compra con su estado, incluso las que hiciste sin red, y pagar las pendientes."
      accion={{ texto: 'Ir a la vitrina', href: '/vitrina' }} respaldo="/mis-cosas" />
  );
}
