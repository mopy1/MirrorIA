import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';
import { ApiError } from '@/src/lib/api';
import { saasApi } from '../api/saasApi';
import {
  armarDto, cambiarCampo, formVacio, PASOS_REGISTRO, validarPaso, type ErroresRegistro, type FormRegistro,
} from '../lib/registro';
import type { CodigoPaleta } from '../types/saas.types';

/**
 * Asistente Plan → Tienda y sucursal → Cuenta (`POST /saas/tiendas`). Al
 * crearla entra logueada como ADMIN de la tienda nueva (el login cambia la
 * tienda de la app) y va a "Plan y suscripción" para activar el plan, como la web.
 */
export function useRegistroTienda(planInicial = '') {
  const { login, logout, user } = useAuth();
  const router = useRouter();
  const [paso, setPaso] = useState(0);
  const [form, setForm] = useState<FormRegistro>(() => formVacio(planInicial));
  const [errores, setErrores] = useState<ErroresRegistro>({});
  const [slugTocado, setSlugTocado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends 'tienda' | 'sucursal' | 'admin'>(grupo: K, campo: keyof FormRegistro[K], valor: string) {
    setForm((f) => cambiarCampo(f, grupo, campo, valor, slugTocado));
    if (grupo === 'tienda' && campo === 'slug') setSlugTocado(true);
  }

  function avanzar(): boolean {
    const e = validarPaso(paso, form);
    setErrores(e);
    if (Object.keys(e).length > 0) return false;
    setPaso((p) => Math.min(p + 1, PASOS_REGISTRO.length - 1));
    return true;
  }

  async function crear() {
    const e = validarPaso(2, form);
    setErrores(e);
    if (Object.keys(e).length > 0) return;
    setEnviando(true);
    setError(null);
    try {
      const res = await saasApi.registrarTienda(armarDto(form));
      if (user) await logout();
      await login(res);
      if (router.canDismiss()) router.dismissAll();
      router.replace('/admin/suscripcion');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear la tienda');
    } finally {
      setEnviando(false);
    }
  }

  return {
    paso,
    form,
    errores,
    set,
    avanzar,
    crear,
    enviando,
    error,
    ultimo: paso === PASOS_REGISTRO.length - 1,
    volver: () => setPaso((p) => Math.max(p - 1, 0)),
    setPlan: (codigo: string) => setForm((f) => ({ ...f, planCodigo: codigo })),
    setPaleta: (paleta: CodigoPaleta) => setForm((f) => ({ ...f, tienda: { ...f.tienda, paleta } })),
  };
}

export type RegistroTienda = ReturnType<typeof useRegistroTienda>;
