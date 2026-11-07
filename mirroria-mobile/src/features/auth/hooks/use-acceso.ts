import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useSesion } from '@/contexts/SesionContext';
import { ApiError, mensajeDeError } from '@/lib/api/errores';
import { login, registrar } from '../api/auth.api';
import { ErrorCuentaPersonal, type DatosLogin, type DatosRegistro, type RespuestaAuth } from '../types/auth.types';

/** Mensajes del backend traducidos a la situación de la clienta (spec §3.2). */
export function mensajeAcceso(e: unknown): string {
  if (e instanceof ErrorCuentaPersonal) return e.message;
  if (e instanceof ApiError) {
    if (e.status === 401) return 'Correo o contraseña incorrectos.';
    if (e.status === 429) return 'Demasiados intentos. Esperá 5 minutos y probá de nuevo.';
    if (e.status === 409) return 'Ese correo ya tiene cuenta en esta tienda. Iniciá sesión.';
  }
  return mensajeDeError(e);
}

/** Login o registro: rechaza cuentas de personal (D2) sin guardar el token. */
function useAcceso<T>(llamar: (d: T) => Promise<RespuestaAuth>) {
  const { iniciarSesion } = useSesion();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: T) => {
      const r = await llamar(d);
      if (r.usuario.role !== 'CUSTOMER') throw new ErrorCuentaPersonal();
      await iniciarSesion({ token: r.accessToken, usuario: r.usuario });
      return r;
    },
    onSuccess: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      void qc.invalidateQueries({ queryKey: ['espejo'] });
      if (router.canDismiss()) router.dismissAll();
      router.replace('/vitrina');
    },
    onError: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  });
}

export const useLogin = () => useAcceso<DatosLogin>(login);
export const useRegistro = () => useAcceso<DatosRegistro>(registrar);
