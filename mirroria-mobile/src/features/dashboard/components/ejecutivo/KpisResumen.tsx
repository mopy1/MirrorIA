import React from 'react';
import { View } from 'react-native';
import { Kpi } from '@/components/admin/Kpi';
import { formatearMontoBs, formatearMontoRedondo } from '../../lib/dashboard.utils';
import { ritmoStock } from '../../lib/graficos';
import { describirVariacion, type VariacionHumana } from '../../lib/variacion';
import type { DashboardEjecutivoDto } from '../../types/dashboard.types';

/** Flecha y % solo si hay con qué comparar; si no, la frase honesta ("sin ventas en el período anterior"). */
function comparar(v: VariacionHumana, pct: number, extra?: string) {
  const conFlecha = v.direccion === 'sube' || v.direccion === 'baja';
  const partes = [conFlecha ? null : v.texto, extra].filter(Boolean);
  return { delta: conFlecha ? pct : null, detalle: partes.join(' · ') || undefined };
}

/** Las cifras del período: lo vendido manda, el resto acompaña. */
export function KpisResumen({ data, compras }: { data: DashboardEjecutivoDto; compras: number }) {
  const k = data.kpis;
  const ingAnt = k.ingresos.anteriorMontoCents / 100;
  const ticketAnt = k.ticketPromedio.anteriorMontoCents / 100;
  const ventas = comparar(
    describirVariacion(k.ingresos.montoBs, ingAnt, k.ingresos.variacionPorcentaje),
    k.ingresos.variacionPorcentaje,
    `En ${compras} ${compras === 1 ? 'compra' : 'compras'} · antes: ${formatearMontoRedondo(ingAnt)}`
  );
  const ticket = comparar(
    describirVariacion(k.ticketPromedio.montoBs, ticketAnt, k.ticketPromedio.variacionPorcentaje),
    k.ticketPromedio.variacionPorcentaje
  );
  const clientas = comparar(
    describirVariacion(
      k.clientesActivos.cantidad,
      k.clientesActivos.anteriorCantidad,
      k.clientesActivos.variacionPorcentaje,
      { textoSinAnterior: 'Nadie había comprado en el período anterior' }
    ),
    k.clientesActivos.variacionPorcentaje
  );
  const rot = k.rotacionInventario;
  const conv = k.conversionReservas;

  return (
    <View className="gap-3">
      <Kpi titulo="Lo que vendiste" valor={formatearMontoBs(k.ingresos.montoBs)} {...ventas} className="min-w-full" />
      <View className="flex-row flex-wrap gap-3">
        <Kpi titulo="Gasto promedio por compra" valor={formatearMontoBs(k.ticketPromedio.montoBs)} {...ticket} />
        <Kpi titulo="Clientas que compraron" valor={String(k.clientesActivos.cantidad)} {...clientas} />
        <Kpi
          titulo="Qué tan rápido se vende tu stock"
          valor={ritmoStock(rot.interpretacion).etiqueta}
          detalle={`Se vendieron ${rot.unidadesVendidas} de ${rot.stockTotalDisponible} prendas disponibles`}
        />
        <Kpi
          titulo="Reservas que terminaron en compra"
          valor={`${conv.reservasConVenta} de ${conv.totalReservasCerradas}`}
          detalle={
            conv.totalReservasCerradas === 0
              ? 'Todavía no hay reservas cerradas en estas fechas'
              : 'reservas cerradas en estas fechas'
          }
        />
      </View>
    </View>
  );
}
