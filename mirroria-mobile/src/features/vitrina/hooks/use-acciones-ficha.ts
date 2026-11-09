import { router } from 'expo-router';
import * as React from 'react';
import { useSesion } from '@/contexts/SesionContext';
import { useAvisoVariante } from '@/features/avisos/hooks/use-aviso-variante';
import { useMutacionesAviso } from '@/features/avisos/hooks/use-avisos';
import { useAgregarCarrito } from '@/features/carrito/hooks/use-agregar-carrito';
import type { FichaPrenda, VarianteFicha } from '@/lib/db/tipos-espejo';

/** Acciones de la ficha: la visitante ve `PedirSesion`; la clienta agrega (encolable), reserva o pide aviso. */
export function useAccionesFicha(productoId: string, ficha: FichaPrenda | null | undefined, variante?: VarianteFicha) {
  const { sesion } = useSesion();
  const agregar = useAgregarCarrito();
  const { crear } = useMutacionesAviso();
  const existente = useAvisoVariante(variante?.id);
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
    /** Talla agotada: guarda el aviso local; si ya existe, lleva a Mis cosas → Avisos. */
    onAvisame: () =>
      conSesion('recibir avisos', () => (existente ? router.push('/mis-cosas/avisos') : variante && crear.mutate(variante.id))),
    aviso: { activo: !!existente, creando: crear.isPending, sinPermiso: crear.data === false },
  };
}
