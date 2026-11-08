import { useCallback, useEffect, useState } from 'react';
import { mensajeDeError } from '@/src/features/admin-cupones/lib/comunes';
import { usuariosAdminApi } from '../api/usuariosAdminApi';
import type { CambioRolDto, SucursalOpcion, UsuarioAdmin } from '../types/usuarios-admin.types';

/** Usuarias de la tienda + sucursales + cambiar rol / activar-desactivar. Los errores son el mensaje del backend. */
export function useUsuariosAdmin() {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [sucursales, setSucursales] = useState<SucursalOpcion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [recargando, setRecargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorEstado, setErrorEstado] = useState<string | null>(null);
  const [cambiandoId, setCambiandoId] = useState<string | null>(null);
  const [guardandoRol, setGuardandoRol] = useState(false);
  const [errorRol, setErrorRol] = useState<string | null>(null);

  const cargar = useCallback(async (esRecarga = false) => {
    if (esRecarga) setRecargando(true);
    setError(null);
    try {
      const [u, s] = await Promise.all([usuariosAdminApi.getUsuarios(), usuariosAdminApi.getSucursales()]);
      setUsuarios(u);
      setSucursales(s);
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudieron cargar los usuarios'));
    } finally {
      setCargando(false);
      setRecargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const reemplazar = (actualizado: UsuarioAdmin) =>
    setUsuarios((lista) => lista.map((u) => (u.id === actualizado.id ? actualizado : u)));

  async function alternarEstado(u: UsuarioAdmin) {
    setCambiandoId(u.id);
    setErrorEstado(null);
    try {
      reemplazar(await usuariosAdminApi.updateEstado(u.id, !u.isActive));
    } catch (err) {
      setErrorEstado(mensajeDeError(err, 'No se pudo guardar'));
    } finally {
      setCambiandoId(null);
    }
  }

  async function cambiarRol(id: string, dto: CambioRolDto): Promise<boolean> {
    setGuardandoRol(true);
    setErrorRol(null);
    try {
      reemplazar(await usuariosAdminApi.updateRol(id, dto.role, dto.sucursalId));
      return true;
    } catch (err) {
      setErrorRol(mensajeDeError(err, 'No se pudo guardar'));
      return false;
    } finally {
      setGuardandoRol(false);
    }
  }

  return {
    usuarios,
    sucursales,
    cargando,
    recargando,
    error,
    errorEstado,
    cambiandoId,
    guardandoRol,
    errorRol,
    limpiarErrorRol: () => setErrorRol(null),
    recargar: () => cargar(true),
    alternarEstado,
    cambiarRol,
  };
}
