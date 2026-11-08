import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { AppState } from 'react-native';
import { useEstadoRed } from '@/lib/red/use-estado-red';
import { faseProbador, SEGUNDOS_POR_SESION } from '@/lib/probador/fase-probador';
import { elegirPrenda, type PrendaProbable } from '@/lib/probador/prendas';
import { useCamaraFrontal } from './use-camara-frontal';
import { usePrendasProbador } from './use-prendas-probador';
import { useSesionDecart } from './use-sesion-decart';

/**
 * Orquesta el probador: encendido explícito (cuida los créditos de Decart), cámara solo con la pantalla
 * enfocada y la app en primer plano, sesión de `SEGUNDOS_POR_SESION` y prenda pedida por la ficha (`?prenda=`).
 */
export function useProbador() {
  const { prenda: pedida } = useLocalSearchParams<{ prenda?: string }>();
  const red = useEstadoRed();
  const prendas = usePrendasProbador();
  const [encendido, setEncendido] = React.useState(false);
  const [motivoPausa, setMotivoPausa] = React.useState<'inicio' | 'tiempo'>('inicio');
  const [eleccion, setEleccion] = React.useState<{ id: string; pedida?: string } | null>(null);
  const [restante, setRestante] = React.useState(SEGUNDOS_POR_SESION);
  const [pedidaVista, setPedidaVista] = React.useState<string | undefined>(undefined);

  const apagar = React.useCallback((motivo: 'inicio' | 'tiempo' = 'inicio') => {
    setEncendido(false);
    setMotivoPausa(motivo);
  }, []);
  const encender = React.useCallback(() => {
    setRestante(SEGUNDOS_POR_SESION);
    setEncendido(true);
  }, []);

  // "Probármelo" desde la ficha (`?prenda=` nuevo): esa prenda y el probador encendido.
  // Patrón "ajustar estado al cambiar una prop" (sin efecto): https://react.dev/learn/you-might-not-need-an-effect
  if (pedida !== pedidaVista) {
    setPedidaVista(pedida);
    if (pedida) encender();
  }
  const idElegido = eleccion && eleccion.pedida === pedida ? eleccion.id : pedida;
  const elegida = React.useMemo(() => (prendas.data ? elegirPrenda(prendas.data, idElegido) : null), [prendas.data, idElegido]);
  const elegir = React.useCallback((p: PrendaProbable) => setEleccion({ id: p.id, pedida }), [pedida]);

  // Salir de la pantalla o mandar la app al fondo corta la sesión (cámara y Decart).
  useFocusEffect(React.useCallback(() => () => apagar(), [apagar]));

  const activo = encendido && red.online;
  const camara = useCamaraFrontal(activo);
  // El diálogo de permiso de Android manda la app a `background`: mientras se pregunta, no se apaga.
  const permisoGranted = camara.permiso === 'concedido';
  React.useEffect(() => {
    if (!permisoGranted) return;
    const sub = AppState.addEventListener('change', (s) => s === 'background' && apagar());
    return () => sub.remove();
  }, [apagar, permisoGranted]);
  const sesion = useSesionDecart(activo ? camara.stream : null, elegida);
  const fase = faseProbador({ online: red.online, activo, motivoPausa, permiso: camara.permiso, camara: camara.estado, sesion: sesion.estado });

  // Cuenta regresiva desde que el video está en vivo; al llegar a 0 se corta la sesión.
  React.useEffect(() => {
    if (fase !== 'en-vivo') return;
    const inicio = Date.now();
    const id = setInterval(() => {
      const r = SEGUNDOS_POR_SESION - (Date.now() - inicio) / 1000;
      setRestante(r);
      if (r <= 0) apagar('tiempo');
    }, 500);
    return () => clearInterval(id);
  }, [fase, apagar]);

  const reintentar = () => (camara.estado === 'error' ? camara.reintentar() : sesion.reintentar());
  return { fase, prendas, elegida, elegir, encender, apagar, reintentar, restante, camara, sesion };
}
