import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { HojaInferior } from '../../saas/components/HojaInferior';
import type { SeccionMarca } from '../../saas/types/saas.types';
import { SECCIONES_RESTABLECER } from '../lib/marca.constants';

interface Props {
  visible: boolean;
  enCurso: boolean;
  onCerrar: () => void;
  onConfirmar: (s: SeccionMarca) => Promise<boolean>;
}

/** Restablecer una sección o todo, siempre con confirmación (se guarda en el momento). */
export function RestablecerHoja({ visible, enCurso, onCerrar, onConfirmar }: Props) {
  const [elegida, setElegida] = useState<SeccionMarca | null>(null);
  const detalle = SECCIONES_RESTABLECER.find((s) => s.valor === elegida);

  async function confirmar() {
    if (elegida && (await onConfirmar(elegida))) {
      setElegida(null);
      onCerrar();
    }
  }

  return (
    <HojaInferior
      visible={visible}
      onCerrar={onCerrar}
      titulo="Restablecer apariencia"
      descripcion="Elegí qué volver a como estaba al crear la tienda."
      pie={
        <>
          <Button variant="outline" className="flex-1" onPress={onCerrar}>
            <Text>Cancelar</Text>
          </Button>
          <Button variant="destructive" className="flex-1" onPress={confirmar} disabled={!elegida || enCurso}>
            <Text>{enCurso ? 'Restableciendo…' : 'Restablecer'}</Text>
          </Button>
        </>
      }
    >
      <View className="gap-2">
        {SECCIONES_RESTABLECER.map((s) => (
          <Pressable key={s.valor} onPress={() => setElegida(s.valor)} className={cn('rounded-xl border p-3', elegida === s.valor ? 'border-destructive bg-destructive/5' : 'border-border')}>
            <Text className="text-sm font-medium text-foreground">{s.label}</Text>
          </Pressable>
        ))}
      </View>
      {detalle && <Text className="text-sm text-muted-foreground">{detalle.detalle} Se guarda en el momento.</Text>}
    </HojaInferior>
  );
}
