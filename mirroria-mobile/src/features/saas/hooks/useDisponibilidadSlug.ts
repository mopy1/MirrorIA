import { useEffect, useState } from 'react';
import { saasApi } from '../api/saasApi';
import { errorDeSlug } from '../lib/slug';

export type EstadoSlug =
  | { tipo: 'vacio' }
  | { tipo: 'invalido'; mensaje: string }
  | { tipo: 'verificando' }
  | { tipo: 'disponible' }
  | { tipo: 'no-disponible'; mensaje: string }
  | { tipo: 'error' };

const MENSAJES = {
  FORMATO: 'El formato no es válido',
  RESERVADO: 'Esa dirección está reservada por la plataforma',
  OCUPADO: 'Ya hay una tienda con esa dirección',
} as const;

/** Chequeo en vivo de la dirección (espera 400 ms) contra `GET /saas/tiendas/disponibilidad`. */
export function useDisponibilidadSlug(slug: string): EstadoSlug {
  const [estado, setEstado] = useState<EstadoSlug>({ tipo: 'vacio' });

  useEffect(() => {
    const local = slug ? errorDeSlug(slug) : null;
    if (!slug || local) {
      setEstado(slug && local ? { tipo: 'invalido', mensaje: local } : { tipo: 'vacio' });
      return;
    }
    setEstado({ tipo: 'verificando' });
    let cancelado = false;
    const timer = setTimeout(() => {
      saasApi
        .getDisponibilidad(slug)
        .then((r) => {
          if (cancelado) return;
          setEstado(r.disponible ? { tipo: 'disponible' } : { tipo: 'no-disponible', mensaje: MENSAJES[r.motivo ?? 'OCUPADO'] });
        })
        .catch(() => !cancelado && setEstado({ tipo: 'error' }));
    }, 400);
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [slug]);

  return estado;
}
