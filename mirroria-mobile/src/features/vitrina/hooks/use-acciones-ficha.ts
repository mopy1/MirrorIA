import { router } from 'expo-router';
import * as React from 'react';
import { useSesion } from '@/contexts/SesionContext';
import { useAgregarCarrito } from '@/features/carrito/hooks/use-agregar-carrito';
import type { FichaPrenda, VarianteFicha } from '@/lib/db/tipos-espejo';

/** Acciones de la ficha: la visitante ve `PedirSesion`; la clienta agrega (encolable) o reserva. */
export function useAccionesFicha(productoId: string, ficha: FichaPrenda | null | undefined, variante?: VarianteFicha) {
  const { sesion } = useSesion();
  const agregar = useAgregarCarrito();
  const [pedir, setPedir] = React.useState<string | null>(null);

  const conSesion = (motivo: string, accion: () => void) => (sesion ? accion() : setPedir(motivo));
  const meta = () => ({
    productoId, prenda: ficha?.producto.titulo, talla: variante?.talla, color: variante?.color,
    imagen: ficha?.producto.imagenes[0]?.url ?? null,
  });

  return {
    agregar,
    pedirSesion: pedir,
    cerrarPedir: () => setPedir(null),
    onAgregar: () => conSesion('agregar al carrito', () => variante && agregar.mutate({ varianteId: variante.id, meta: meta() })),
    onReservar: () =>
      conSesion('reservar', () => router.push({ pathname: '/vitrina/[productoId]/reservar', params: { productoId, variante: variante?.id ?? '' } })),
    onAvisame: () => conSesion('recibir avisos', () => router.push('/mis-cosas/avisos')),
  };
}
