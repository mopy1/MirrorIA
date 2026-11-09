import React from 'react';
import { View } from 'react-native';
import { CloudOff, CloudUpload, TriangleAlert } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Aviso } from '@/src/features/staff/components/Aviso';

interface Props {
  enLinea: boolean;
  guardaSinRed: boolean;
  delTelefono: boolean;
  vencida: boolean;
  fotoGuardadaEn: number | null;
  pendientes: number;
  enviando: boolean;
  onEnviar: () => void;
}

const hora = (ms: number) => new Date(ms).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });

/** Conexión, stock guardado y ventas que esperan red: lo que la cajera tiene que saber antes de cobrar. */
export function EstadoCaja({ enLinea, guardaSinRed, delTelefono, vencida, fotoGuardadaEn, pendientes, enviando, onEnviar }: Props) {
  return (
    <View className="gap-2">
      {!enLinea || delTelefono ? (
        <Aviso tono="alerta" icono={CloudOff}>
          {`${guardaSinRed ? 'Sin conexión. Las ventas se guardan en este teléfono y se envían solas al volver internet.' : 'Sin conexión. En la computadora no se puede cobrar sin internet.'}${
            fotoGuardadaEn ? ` Stock guardado el ${hora(fotoGuardadaEn)}.` : ''
          }`}
        </Aviso>
      ) : null}
      {vencida ? (
        <Aviso tono="error" icono={TriangleAlert}>
          El stock guardado tiene más de 7 días: puede no ser real y el servidor no acepta ventas tan viejas. Conectate antes de cobrar.
        </Aviso>
      ) : null}
      {pendientes > 0 ? (
        <Aviso
          tono="info"
          icono={CloudUpload}
          accion={
            enLinea ? (
              <Button size="sm" variant="outline" onPress={onEnviar} disabled={enviando} className="self-start">
                <Text>{enviando ? 'Enviando…' : 'Enviar ahora'}</Text>
              </Button>
            ) : undefined
          }
        >
          {`${pendientes} ${pendientes === 1 ? 'venta espera' : 'ventas esperan'} enviarse al servidor. No cierres sesión hasta que se envíen.`}
        </Aviso>
      ) : null}
    </View>
  );
}
