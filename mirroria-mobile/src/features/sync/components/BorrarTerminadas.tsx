import { Trash } from 'phosphor-react-native';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

/** Destructiva con confirmación: borra del teléfono las CONFIRMADA/COMPENSADA/RECHAZADA (nada del servidor). */
export function BorrarTerminadas({ cantidad, onBorrar }: { cantidad: number; onBorrar: () => void }) {
  if (cantidad === 0) return null;
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="mx-5">
          <Icon as={Trash} size={16} className="text-danger" />
          <Text className="text-danger">Borrar terminadas ({cantidad})</Text>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Borrar {cantidad} terminadas?</AlertDialogTitle>
          <AlertDialogDescription>Se quitan solo de este teléfono. Tus compras y reservas confirmadas siguen en la tienda.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            <Text>Cancelar</Text>
          </AlertDialogCancel>
          <AlertDialogAction onPress={onBorrar} className="bg-destructive">
            <Text className="text-destructive-foreground">Borrar</Text>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
