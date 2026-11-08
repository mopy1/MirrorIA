import React from 'react';
import { View } from 'react-native';
import { Kpi } from '@/components/admin/Kpi';
import { formatearMontoBs } from '../../lib/dashboard.utils';
import type { KpisOperativoDto } from '../../types/dashboard.types';

const n = (cant: number, uno: string, varios: string) => `${cant} ${cant === 1 ? uno : varios}`;

/** Los 4 números del día, en lenguaje de mostrador (mismos textos que la web). */
export function NumerosDelDia({ kpis }: { kpis: KpisOperativoDto }) {
  const { ventas: v, cobrosPendientes: c, reservas: r, stock: s } = kpis;
  return (
    <View className="flex-row flex-wrap gap-3">
      <Kpi
        titulo="Vendido hoy"
        valor={formatearMontoBs(v.montoBs)}
        detalle={v.cantidadTickets > 0 ? `En ${n(v.cantidadTickets, 'compra', 'compras')}` : 'Todavía sin ventas hoy'}
      />
      <Kpi
        titulo="Cobros por confirmar"
        valor={String(c.cantidad)}
        detalle={c.cantidad > 0 ? `${formatearMontoBs(c.montoEstimadoBs)} esperando confirmación` : 'Nada pendiente'}
        className={c.cantidad > 0 ? 'border-amber-400' : undefined}
      />
      <Kpi
        titulo="Citas de hoy"
        valor={`${r.porLlegar} por llegar`}
        detalle={`${r.enTienda} en la tienda · ${n(r.completadas, 'completada', 'completadas')}`}
      />
      <Kpi
        titulo="Prendas por agotarse"
        valor={String(s.criticos)}
        detalle={
          s.criticos + s.agotados > 0
            ? `${s.agotados > 0 ? `${n(s.agotados, 'agotada', 'agotadas')} · ` : ''}Conviene reponer pronto`
            : 'Todo con stock'
        }
        className={s.agotados > 0 ? 'border-rose-400' : undefined}
      />
    </View>
  );
}
