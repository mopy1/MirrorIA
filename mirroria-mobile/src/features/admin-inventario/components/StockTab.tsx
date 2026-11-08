import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Search } from 'lucide-react-native';
import { Cargando, Vacio } from '@/components/admin/Estados';
import { Kpi } from '@/components/admin/Kpi';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { filasStock, resumenStock, type FiltroNivel } from '../lib/stock';
import type { InventarioSucursal, VarianteConProducto } from '../types/inventario.types';
import { Pestanas } from './Pestanas';
import { StockCard } from './StockCard';

interface Props {
  filas: InventarioSucursal[];
  variantes: VarianteConProducto[];
  cargando: boolean;
  onAjustar: (varianteId: string) => void;
  onPedir?: (varianteId: string) => void;
}

/** Disponibilidad física de la sucursal: cifras, alertas (agotado / bajo) y una tarjeta por variante. */
export function StockTab({ filas, variantes, cargando, onAjustar, onPedir }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<FiltroNivel>('todas');
  const r = useMemo(() => resumenStock(filas), [filas]);
  const lista = useMemo(() => filasStock(filas, variantes, busqueda, filtro), [filas, variantes, busqueda, filtro]);
  const alertas = r.agotadas + r.bajas;

  if (cargando) return <Cargando texto="Cargando stock…" />;
  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-2">
        <Kpi titulo="Unidades disponibles" valor={String(r.unidades)} detalle={`${r.variantes} variantes`} />
        <Kpi titulo="En camino" valor={String(r.enTransito)} detalle={`${r.reservadas} reservadas`} />
      </View>
      {alertas > 0 ? (
        <View className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
          <Text className="text-sm text-amber-800">
            {r.agotadas > 0 ? `${r.agotadas} agotada${r.agotadas === 1 ? '' : 's'}` : ''}
            {r.agotadas > 0 && r.bajas > 0 ? ' y ' : ''}
            {r.bajas > 0 ? `${r.bajas} con poco stock (5 u. o menos)` : ''}. Reponé antes de quedarte sin ventas.
          </Text>
        </View>
      ) : null}
      <Pestanas items={[{ id: 'todas', label: 'Todas' }, { id: 'alertas', label: `Alertas (${alertas})` }]} valor={filtro} onCambiar={setFiltro} />
      <View className="relative justify-center">
        <View className="absolute left-3 z-10">
          <Icon as={Search} size={16} className="text-muted-foreground" />
        </View>
        <Input value={busqueda} onChangeText={setBusqueda} placeholder="Buscar prenda, talla, color o SKU…" className="pl-9" autoCorrect={false} />
      </View>
      {lista.length === 0 ? (
        <Vacio
          titulo={filas.length === 0 ? 'No hay registros de inventario para esta sucursal' : filtro === 'alertas' && !busqueda ? 'Sin alertas: todo con stock' : 'Nada coincide con la búsqueda'}
          detalle={filas.length === 0 ? 'Usá "Ajustar" para cargar el primer ingreso de mercadería.' : undefined}
        />
      ) : (
        lista.map((f) => (
          <StockCard key={f.id} fila={f} onAjustar={() => onAjustar(f.varianteId)} onPedir={onPedir ? () => onPedir(f.varianteId) : undefined} />
        ))
      )}
    </View>
  );
}
