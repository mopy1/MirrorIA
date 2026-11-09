import { SignOut } from 'phosphor-react-native';
import * as React from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Text } from '@/components/ui/text';
import { useSesion } from '@/contexts/SesionContext';
import { FilaEnlace } from './FilaEnlace';

/** Destructiva siempre con confirmación (alert-dialog). */
export function CerrarSesion({ tienda }: { tienda: string }) {
  const { cerrarSesion } = useSesion();
  const [abierto, setAbierto] = React.useState(false);
  return (
    <>
      <FilaEnlace icono={SignOut} titulo="Cerrar sesión" onPress={() => setAbierto(true)} peligro />
      <AlertDialog open={abierto} onOpenChange={setAbierto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar sesión en {tienda}?</AlertDialogTitle>
            <AlertDialogDescription>Vas a poder seguir mirando la vitrina como visitante.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text>Cancelar</Text>
            </AlertDialogCancel>
            <AlertDialogAction onPress={() => void cerrarSesion()}>
              <Text>Cerrar sesión</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
