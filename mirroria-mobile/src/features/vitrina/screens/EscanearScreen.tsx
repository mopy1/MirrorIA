import { Scan } from 'phosphor-react-native';
import { PantallaProximamente } from '@/components/common/PantallaProximamente';

/** `vitrina/escanear` (D10, se construye en M4). */
export default function EscanearScreen() {
  return (
    <PantallaProximamente
      encabezado="Escanear etiqueta"
      icono={Scan}
      titulo="Escaneá la etiqueta en la tienda"
      texto="Apuntá la cámara al código de la prenda y vas a ver su ficha, tu talla en otras sucursales y si podés reservarla. Funciona sin internet."
      accion={{ texto: 'Ver la vitrina', href: '/vitrina' }}
      respaldo="/vitrina"
    />
  );
}
