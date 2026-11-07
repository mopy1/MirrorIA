import * as React from 'react';
import { contextoHttp } from '@/lib/api/contexto-http';
import { jwtVencido } from '@/lib/sesion/jwt';
import { borrarSesion, guardarSesion, leerSesion, type Sesion } from '@/lib/sesion/sesion-store';
import { useTienda } from './TiendaContext';

interface ValorSesion {
  /** Sesión de la clienta en ESTA tienda; null = visitante. */
  sesion: Sesion | null;
  cargada: boolean;
  iniciarSesion: (s: Sesion) => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

const Ctx = React.createContext<ValorSesion | null>(null);

/** Sesión por tienda en SecureStore. Solo cuentas CUSTOMER llegan acá (D2: el login rechaza al personal). */
export function SesionProvider({ children }: { children: React.ReactNode }) {
  const { tienda } = useTienda();
  const slug = tienda?.slug ?? null;
  const [sesion, setSesion] = React.useState<Sesion | null>(null);
  const [cargada, setCargada] = React.useState(false);

  React.useEffect(() => {
    let vivo = true;
    setCargada(false);
    (async () => {
      let s = slug ? await leerSesion(slug) : null;
      if (s && (jwtVencido(s.token) || s.usuario.role !== 'CUSTOMER')) {
        await borrarSesion(slug!);
        s = null;
      }
      if (!vivo) return;
      contextoHttp.token = s?.token ?? null;
      setSesion(s);
      setCargada(true);
    })();
    return () => {
      vivo = false;
    };
  }, [slug]);

  const cerrarSesion = React.useCallback(async () => {
    if (slug) await borrarSesion(slug);
    contextoHttp.token = null;
    setSesion(null);
  }, [slug]);

  const iniciarSesion = React.useCallback(
    async (s: Sesion) => {
      if (!slug) return;
      await guardarSesion(slug, s);
      contextoHttp.token = s.token;
      setSesion(s);
    },
    [slug],
  );

  React.useEffect(() => {
    contextoHttp.alExpirarSesion = () => void cerrarSesion();
    return () => {
      contextoHttp.alExpirarSesion = null;
    };
  }, [cerrarSesion]);

  const valor = React.useMemo(() => ({ sesion, cargada, iniciarSesion, cerrarSesion }), [sesion, cargada, iniciarSesion, cerrarSesion]);
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useSesion(): ValorSesion {
  const v = React.useContext(Ctx);
  if (!v) throw new Error('useSesion fuera de SesionProvider');
  return v;
}
