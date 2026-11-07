import { CloudSlash, WarningCircle } from 'phosphor-react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ErrorSinRed, mensajeDeError } from '@/lib/api/errores';
import { EstadoVacio } from './EstadoVacio';

/** Error con mensaje claro + "Reintentar". */
export function EstadoError({ error, onReintentar, titulo }: { error: unknown; onReintentar: () => void; titulo?: string }) {
  const sinRed = error instanceof ErrorSinRed;
  return (
    <EstadoVacio
      icono={sinRed ? CloudSlash : WarningCircle}
      tono={sinRed ? 'aviso' : 'error'}
      titulo={titulo ?? (sinRed ? 'Sin conexión' : 'No pudimos cargar esto')}
      texto={mensajeDeError(error)}
    >
      <Button onPress={onReintentar}>
        <Text>Reintentar</Text>
      </Button>
    </EstadoVacio>
  );
}
