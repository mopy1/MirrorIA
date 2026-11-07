import { router } from 'expo-router';
import * as React from 'react';
import { useSesion } from '@/contexts/SesionContext';
import { useAgregarCarrito } from '@/features/carrito/hooks/use-agregar-carrito';
import type { VarianteFicha } from '@/lib/db/tipos-espejo';

/** Acciones de la ficha: la visitante ve `PedirSesion`; la clienta agrega/reserva. */
export function useAccionesFicha(productoId: string, variante?: VarianteFicha) {
  const { sesion } = useSesion();
  const agregar = useAgregarCarrito();
  const [pedir, setPedir] = React.useState<string | null>(null);

  const conSesion = (motivo: string, accion: () => void) => (sesion ? accion() : setPedir(motivo));

  return {
    agregar,
    pedirSesion: pedir,
    cerrarPedir: () => setPedir(null),
    onAgregar: () => conSesion('agregar al carrito', () => variante && agregar.mutate(variante.id)),
    onReservar: () => conSesion('reservar', () => router.push(`/vitrina/${productoId}/reservar`)),
    onAvisame: () => conSesion('recibir avisos', () => router.push('/mis-cosas/avisos')),
  };
}
