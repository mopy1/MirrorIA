import React from 'react';
import { Vacio } from '@/components/admin/Estados';
import { PantallaAdmin } from '@/components/admin/PantallaAdmin';
import { CambioVista } from '../components/comun/CambioVista';
import { VistaResumen } from '../components/ejecutivo/VistaResumen';
import { VistaTienda } from '../components/operativo/VistaTienda';
import { useDashboard } from '../hooks/useDashboard';

/**
 * Inicio del panel (= web /admin/dashboard): la dueña ve "Resumen del negocio" y "Hoy en la
 * tienda"; encargada y cajera, solo "Hoy en la tienda" de su sucursal.
 */
export function DashboardScreen() {
  const { rol, modos, modo, cambiarModo, filtros, ejecutivo, operativo } = useDashboard();
  const activo = modo === 'resumen' ? ejecutivo : operativo;
  const titulo = modos.length > 1 ? 'Inicio' : 'Hoy en la tienda';

  if (!modo) {
    return (
      <PantallaAdmin titulo="Inicio">
        <Vacio titulo="Esta pantalla es solo para el equipo de la tienda" />
      </PantallaAdmin>
    );
  }

  return (
    <PantallaAdmin titulo={titulo} recargando={activo.isLoading && !!activo.data} onRecargar={activo.recargar}>
      <CambioVista modos={modos} actual={modo} onCambiar={cambiarModo} />
      {modo === 'resumen' ? (
        <VistaResumen
          filtros={filtros}
          data={ejecutivo.data}
          isLoading={ejecutivo.isLoading}
          error={ejecutivo.error}
          onRecargar={ejecutivo.recargar}
        />
      ) : (
        <VistaTienda
          rol={rol}
          data={operativo.data}
          isLoading={operativo.isLoading}
          error={operativo.error}
          onRecargar={operativo.recargar}
          sucursalId={filtros.sucursalId}
          onSucursal={rol === 'ADMIN' ? filtros.setSucursalId : undefined}
        />
      )}
    </PantallaAdmin>
  );
}
