import { useState } from 'react';
import { useAuth } from '@/src/hooks/useAuth';
import { dashboardApi } from '../api/dashboardApi';
import { rangoListo } from '../lib/periodo';
import { modoInicial, modosParaRol, sucursalParaOperativo, type ModoDashboard } from '../lib/vista-rol';
import type { PeriodoDashboard } from '../types/dashboard.types';
import { useConsulta } from './useConsulta';

/** Estado del Inicio: vista según rol, filtros y los dos orígenes de datos (solo se pide el visible). */
export function useDashboard() {
  const { user } = useAuth();
  const rol = user?.role;
  const modos = modosParaRol(rol);
  const [pedido, setPedido] = useState<ModoDashboard | null>(null);
  const modo = modoInicial(rol, pedido);

  const [periodo, setPeriodo] = useState<PeriodoDashboard>('30d');
  const [fechaInicio, setFechaInicio] = useState<string | undefined>();
  const [fechaFin, setFechaFin] = useState<string | undefined>();
  const [sucursalId, setSucursalId] = useState<string | undefined>();

  const listo = periodo !== 'personalizado' || rangoListo(fechaInicio, fechaFin);
  const ejecutivo = useConsulta(
    () => dashboardApi.ejecutivo({ periodo, fechaInicio, fechaFin, sucursalId }),
    [periodo, fechaInicio, fechaFin, sucursalId],
    modo === 'resumen' && listo
  );
  const sucOperativo = sucursalParaOperativo(rol, sucursalId);
  const operativo = useConsulta(() => dashboardApi.operativo(sucOperativo), [sucOperativo], modo === 'tienda');

  return {
    rol,
    modos,
    modo,
    cambiarModo: setPedido,
    filtros: { periodo, fechaInicio, fechaFin, sucursalId, setPeriodo, setFechaInicio, setFechaFin, setSucursalId },
    ejecutivo,
    operativo,
  };
}
