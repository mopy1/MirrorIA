import React, { useMemo, useState } from 'react';
import { PantallaAdmin } from '@/components/admin/PantallaAdmin';
import { Cargando, ErrorVista, Vacio } from '@/components/admin/Estados';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/src/hooks/useAuth';
import { AvisoError } from '@/src/features/admin-cupones/components/comunes/AvisoError';
import { SoloAdmin } from '@/src/features/admin-cupones/components/comunes/SoloAdmin';
import { FiltroUsuarios } from '../components/FiltroUsuarios';
import { RolHoja } from '../components/RolHoja';
import { UsuarioTarjeta } from '../components/UsuarioTarjeta';
import { useUsuariosAdmin } from '../hooks/useUsuariosAdmin';
import { filtrarUsuarios, type FiltroRol } from '../lib/usuarios';
import type { UsuarioAdmin } from '../types/usuarios-admin.types';

const TITULO = 'Equipo y permisos';

function Contenido() {
  const { user } = useAuth();
  const u = useUsuariosAdmin();
  const [busqueda, setBusqueda] = useState('');
  const [rol, setRol] = useState<FiltroRol>('TODOS');
  const [editando, setEditando] = useState<UsuarioAdmin | null>(null);

  const visibles = useMemo(() => filtrarUsuarios(u.usuarios, busqueda, rol), [u.usuarios, busqueda, rol]);
  const nombreSucursal = (id: string | null) => u.sucursales.find((s) => s.id === id)?.nombre;

  return (
    <PantallaAdmin
      titulo={TITULO}
      subtitulo={`${u.usuarios.length} usuarios`}
      recargando={u.recargando}
      onRecargar={u.recargar}
    >
      <Text className="text-sm text-muted-foreground">Roles, sucursal de cada persona del equipo y acceso a la tienda.</Text>
      <FiltroUsuarios busqueda={busqueda} onBusqueda={setBusqueda} rol={rol} onRol={setRol} />
      <AvisoError mensaje={u.errorEstado} />
      {u.cargando ? (
        <Cargando texto="Cargando usuarios…" />
      ) : u.error ? (
        <ErrorVista mensaje={u.error} onReintentar={u.recargar} />
      ) : visibles.length === 0 ? (
        <Vacio titulo="No se encontraron usuarios que coincidan con la búsqueda." />
      ) : (
        visibles.map((x) => (
          <UsuarioTarjeta
            key={x.id}
            usuario={x}
            sucursalNombre={nombreSucursal(x.sucursalId)}
            esYo={x.id === user?.id}
            cambiando={u.cambiandoId === x.id}
            onCambiarRol={() => {
              u.limpiarErrorRol();
              setEditando(x);
            }}
            onAlternarEstado={() => u.alternarEstado(x)}
          />
        ))
      )}
      <RolHoja
        usuario={editando}
        sucursales={u.sucursales}
        guardando={u.guardandoRol}
        error={u.errorRol}
        onCerrar={() => setEditando(null)}
        onGuardar={u.cambiarRol}
      />
    </PantallaAdmin>
  );
}

/** Equipo y permisos (solo ADMIN): rol, sucursal y acceso de cada cuenta de la tienda. */
export function UsuariosScreen() {
  return (
    <SoloAdmin titulo={TITULO}>
      <Contenido />
    </SoloAdmin>
  );
}
