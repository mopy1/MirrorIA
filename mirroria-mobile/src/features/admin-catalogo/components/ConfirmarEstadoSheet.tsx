import React from 'react';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { AvisoError } from './form/Aviso';
import { HojaInferior } from './form/HojaInferior';

interface Props {
  visible: boolean;
  activa: boolean;
  titulo: string;
  ocupado: boolean;
  error: string | null;
  onCerrar: () => void;
  onConfirmar: () => void;
}

/** Confirmación antes de desactivar (o reactivar) una prenda. */
export function ConfirmarEstadoSheet({ visible, activa, titulo, ocupado, error, onCerrar, onConfirmar }: Props) {
  return (
    <HojaInferior
      aviso={<AvisoError mensaje={error} />}
      visible={visible}
      onCerrar={onCerrar}
      titulo={activa ? '¿Desactivar esta prenda?' : '¿Reactivar esta prenda?'}
      pie={
        <>
          <Button variant="outline" className="flex-1 h-12" onPress={onCerrar}>
            <Text>Cancelar</Text>
          </Button>
          <Button variant={activa ? 'destructive' : 'default'} className="flex-1 h-12" disabled={ocupado} onPress={onConfirmar}>
            <Text>{ocupado ? 'Guardando…' : activa ? 'Desactivar' : 'Reactivar'}</Text>
          </Button>
        </>
      }
    >
      <Text className="text-sm">
        {activa
          ? `"${titulo}" deja de verse en la tienda y no se puede vender. Su stock y su historial se conservan, y libera un lugar de tu plan.`
          : `"${titulo}" vuelve a la vitrina y ocupa un lugar de tu plan.`}
      </Text>
    </HojaInferior>
  );
}
