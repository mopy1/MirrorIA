import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { ApiError } from '@/src/lib/api';
import { storage } from '@/src/lib/storage';
import { alCambiarTienda, tiendaActual } from '@/src/lib/tienda';
import { saasApi } from '../api/saasApi';
import { marcaParaApp, type MarcaApp } from '../lib/marca-tienda';
import type { TiendaPublica } from '../types/saas.types';

// Una sola ficha por tienda para toda la app: el encabezado, el perfil y el
// login la piden a la vez y no tiene sentido ir tres veces al servidor.
const fichas = new Map<string, TiendaPublica>();
const enCurso = new Map<string, Promise<void>>();
const oyentes = new Set<() => void>();
const CLAVE = (slug: string) => `mirroria_ficha_${slug}`;
const avisar = () => oyentes.forEach((fn) => fn());

async function traer(slug: string): Promise<void> {
  try {
    const t = await saasApi.resolverTienda(slug);
    fichas.set(slug, t);
    await storage.setItem(CLAVE(slug), JSON.stringify(t)).catch(() => undefined);
  } catch (err) {
    // Sin red se usa la última ficha vista; una tienda que no existe no se disimula.
    if (err instanceof ApiError && err.status > 0 && err.status < 500) {
      fichas.delete(slug);
    } else {
      const copia = await storage.getItem(CLAVE(slug)).catch(() => null);
      if (copia) fichas.set(slug, JSON.parse(copia) as TiendaPublica);
    }
  } finally {
    enCurso.delete(slug);
    avisar();
  }
}

function pedir(slug: string, forzar = false) {
  if (!forzar && (fichas.has(slug) || enCurso.has(slug))) return;
  if (enCurso.has(slug)) return;
  enCurso.set(slug, traer(slug));
}

/** Vuelve a leer la ficha (p. ej. después de guardar la apariencia). */
export function refrescarMarcaTienda(slug = tiendaActual()) {
  pedir(slug, true);
}

/** Nombre, logo, color y disponibilidad de la tienda en la que está la app. */
export function useMarcaTienda(): { slug: string; tienda: TiendaPublica | null; marca: MarcaApp | null; cargando: boolean } {
  const [slug, setSlug] = useState(tiendaActual());
  const [, setVersion] = useState(0);

  useEffect(() => {
    const rerender = () => setVersion((v) => v + 1);
    oyentes.add(rerender);
    const quitar = alCambiarTienda((nuevo) => {
      setSlug(nuevo);
      pedir(nuevo);
    });
    return () => {
      oyentes.delete(rerender);
      quitar();
    };
  }, []);

  useEffect(() => pedir(slug), [slug]);

  const tienda = fichas.get(slug) ?? null;
  return {
    slug,
    tienda,
    marca: tienda ? marcaParaApp(tienda, Platform.OS === 'web') : null,
    cargando: !tienda && enCurso.has(slug),
  };
}
