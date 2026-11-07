import { Bell } from 'phosphor-react-native';
import { PantallaProximamente } from '@/components/common/PantallaProximamente';

/** `mis-cosas/avisos`: "Avisame cuando vuelva" (M4). */
export default function AvisosScreen() {
  return (
    <PantallaProximamente encabezado="Avisos" icono={Bell} titulo="Te avisamos cuando vuelva"
      texto="Si tu talla está agotada, la app te manda una notificación cuando la tienda la reponga."
      accion={{ texto: 'Ir a la vitrina', href: '/vitrina' }} respaldo="/mis-cosas" />
  );
}
