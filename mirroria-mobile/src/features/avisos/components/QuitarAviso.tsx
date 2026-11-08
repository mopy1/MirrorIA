import * as React from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Text } from '@/components/ui/text';

interface Props {
  prenda: string | null;
  abierto: boolean;
  onCerrar: () => void;
  onConfirmar: () => void;
}

/** Destructiva con confirmación (spec §7.5). */
export function QuitarAviso({ prenda, abierto, onCerrar, onConfirmar }: Props) {
  return (
    <AlertDialog open={abierto} onOpenChange={(v) => !v && onCerrar()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Quitar el aviso?</AlertDialogTitle>
          <AlertDialogDescription>
            Ya no te vamos a avisar cuando vuelva {prenda ?? 'esta prenda'}. Podés volver a activarlo desde la ficha.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            <Text>Cancelar</Text>
          </AlertDialogCancel>
          <AlertDialogAction onPress={onConfirmar}>
            <Text>Quitar aviso</Text>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
