import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTema } from '@/contexts/TemaContext';
import { formatoBs } from '@/lib/formato/dinero';
import type { MetodoPagoApp, VistaPago } from '@/lib/pagos/estado-pago';

interface Props {
  metodo: MetodoPagoApp | null;
  /** El método elegido ya tiene un cobro iniciado. */
  iniciado: boolean;
  vista: VistaPago;
  totalCents: number;
  bloqueo: string | null;
  cargando: boolean;
  error: string | null;
  onIniciar: () => void;
  onRevisar: () => void;
  onEntendido: () => void;
}

/** Una sola acción primaria según el paso (zona del pulgar). RN08: deshabilitada sin red, con el motivo. */
export function PiePago(p: Props) {
  const insets = useSafeAreaInsets();
  const { colores } = useTema();
  let texto = 'Elegí cómo pagar';
  let accion = p.onIniciar;
  if (p.metodo === 'QR') texto = p.vista === 'QR_VENCIDO' ? 'Generar otro QR' : p.iniciado ? 'Ya pagué, revisar' : `Generar QR · ${formatoBs(p.totalCents)}`;
  if (p.metodo === 'TARJETA') texto = p.iniciado ? 'Ya pagué, revisar' : `Pagar con tarjeta · ${formatoBs(p.totalCents)}`;
  if (p.metodo === 'EFECTIVO') texto = p.iniciado ? 'Entendido' : 'Pagar en caja';
  if (p.iniciado && p.vista !== 'QR_VENCIDO') accion = p.metodo === 'EFECTIVO' ? p.onEntendido : p.onRevisar;
  const usaRed = !(p.iniciado && p.metodo === 'EFECTIVO');
  const deshabilitado = !p.metodo || p.cargando || (usaRed && !!p.bloqueo);

  return (
    <View className="border-t border-border bg-background px-5 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
      {p.error ? <Text className="mb-2 text-center text-sm text-danger">{p.error}</Text> : null}
      <Button size="lg" className="h-[52px]" disabled={deshabilitado} onPress={accion}>
        {p.cargando ? <ActivityIndicator color={colores['primary-foreground']} /> : null}
        <Text>{texto}</Text>
      </Button>
      {p.bloqueo ? <Text className="mt-2 text-center text-xs leading-4 text-warning">{p.bloqueo}</Text> : null}
    </View>
  );
}
