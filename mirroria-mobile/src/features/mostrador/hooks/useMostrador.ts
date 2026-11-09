import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import { useAuth } from '@/src/hooks/useAuth';
import { ApiError, tiendaActual } from '@/src/lib/api';
import { conCatalogoLocal } from '@/src/lib/offline/catalogoLocal';
import { anotarEnviada, encolarVenta } from '@/src/lib/offline/colaCaja';
import { baseLocal } from '@/src/lib/offline/expoBase';
import { fotoVencida, guardarStockCaja, leerStockCaja, type FotoStock } from '@/src/lib/offline/stockCajaLocal';
import { mostradorApi, type SucursalCaja } from '../api/mostradorApi';
import { correrSincronizacionCaja } from '../lib/correr-sincronizacion';
import { avisarCambioCaja } from '../lib/eventos-caja';
import {
  armarPayload, cobrar, resumenVenta, totalCents, type ClientaVenta, type LineaVenta, type ResultadoCobro,
} from '../lib/venta-caja';
import { useColaCaja } from './useColaCaja';
import { useEnLinea } from './useEnLinea';

/** En la PC (Expo web) no hay SQLite: la caja solo vende con internet. */
const GUARDA_SIN_RED = Platform.OS !== 'web';

function esSinRed(e: unknown): boolean {
  return e instanceof ApiError ? e.status === 0 : !(e instanceof Error && 'status' in e);
}

/** Caja del mostrador: foto del stock de la sucursal en el teléfono y ventas que siguen sin conexión. */
export function useMostrador() {
  const { user } = useAuth();
  const tienda = tiendaActual();
  const propia = user?.sucursalId ?? null;
  const enLinea = useEnLinea();
  const [sucursales, setSucursales] = useState<SucursalCaja[]>([]);
  const [elegida, setElegida] = useState<string | null>(null);
  const sucursalId = propia ?? elegida;
  const [foto, setFoto] = useState<FotoStock | null>(null);
  const [delTelefono, setDelTelefono] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cola = useColaCaja({ tienda, usuarioId: user?.id, sucursalId, fotoTomadaEn: foto?.guardadoEn ?? null });

  useEffect(() => {
    if (propia) return;
    void (async () => {
      try {
        const lista = await conCatalogoLocal(await baseLocal(), tienda, 'caja-sucursales', mostradorApi.getSucursales);
        setSucursales(lista);
        setElegida((a) => a ?? lista[0]?.id ?? null);
      } catch {
        setSucursales([]);
      }
    })();
  }, [tienda, propia]);

  const cargar = useCallback(async () => {
    if (!sucursalId) return;
    setCargando(true);
    setError(null);
    const db = await baseLocal();
    try {
      const items = await mostradorApi.getCatalogo(sucursalId);
      const ahora = Date.now();
      await guardarStockCaja(db, tienda, sucursalId, items, ahora);
      setFoto({ items, guardadoEn: ahora });
      setDelTelefono(false);
    } catch (e) {
      if (!esSinRed(e)) {
        setError(e instanceof Error ? e.message : 'No se pudo cargar el catálogo');
      } else {
        const guardada = await leerStockCaja(db, tienda, sucursalId);
        setFoto(guardada);
        setDelTelefono(true);
        if (!guardada) {
          setError(
            GUARDA_SIN_RED
              ? 'Sin conexión y sin catálogo guardado. Abrí el mostrador una vez con internet.'
              : 'Sin conexión. En la computadora la caja necesita internet; sin red usá la app del teléfono.',
          );
        }
      }
    } finally {
      setCargando(false);
    }
  }, [sucursalId, tienda]);

  useEffect(() => {
    void cargar();
  }, [cargar, enLinea]);

  // Al volver la red: primero se manda lo pendiente y después se trae el stock real.
  useEffect(() => {
    if (!enLinea || !user) return;
    void correrSincronizacionCaja({ tienda, usuarioId: user.id }).then((r) => {
      if (r.enviadas > 0 || r.fallidas > 0) void cargar();
    }).catch(() => {});
  }, [enLinea, user, tienda, cargar]);

  async function vender(lineas: LineaVenta[], clienta: ClientaVenta | null): Promise<ResultadoCobro> {
    if (!sucursalId || !user) throw new Error('Elegí una sucursal para cobrar');
    const cajera = { tienda, usuarioId: user.id };
    const db = await baseLocal();
    const r = await cobrar(
      { payload: armarPayload(sucursalId, lineas, clienta, new Date()), resumen: resumenVenta(lineas), totalCents: totalCents(lineas) },
      {
        enLinea: () => enLinea,
        enviar: (cuerpo, clave) => mostradorApi.enviarVenta(cuerpo, clave, tienda),
        encolar: async (v) => {
          if (!GUARDA_SIN_RED) {
            throw new Error('Sin conexión: en la computadora la venta no se puede guardar. No cobres todavía o usá la app del teléfono.');
          }
          await encolarVenta(db, cajera, v);
        },
        anotarEnviada: (v, resp) => anotarEnviada(db, cajera, v, resp),
        generarId: () => Crypto.randomUUID(),
      },
    );
    avisarCambioCaja();
    if (r.estado === 'REGISTRADA') void cargar();
    return r;
  }

  return {
    enLinea,
    guardaSinRed: GUARDA_SIN_RED,
    sucursales,
    sucursalId,
    debeElegirSucursal: !propia,
    elegirSucursal: setElegida,
    catalogo: foto?.items ?? [],
    fotoGuardadaEn: foto?.guardadoEn ?? null,
    delTelefono,
    vencida: foto ? fotoVencida(foto) : false,
    cargando,
    error,
    recargar: cargar,
    vender,
    ...cola,
  };
}
