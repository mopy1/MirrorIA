import React from 'react';
import { useSucursalesActivas } from '../../hooks/useSucursalesActivas';
import { SelectorChips } from './SelectorChips';

const TODAS = '__todas__';

interface Props {
  sucursalId?: string;
  onCambiar: (id?: string) => void;
}

/** "Todas las sucursales" + cada sucursal activa. Sin sucursales (o si falla), no se muestra. */
export function SelectorSucursal({ sucursalId, onCambiar }: Props) {
  const sucursales = useSucursalesActivas();
  if (sucursales.length === 0) return null;
  const opciones = [
    { id: TODAS, label: 'Todas las sucursales' },
    ...sucursales.map((s) => ({ id: s.id, label: s.nombre })),
  ];
  return (
    <SelectorChips
      etiqueta="Sucursal"
      opciones={opciones}
      valor={sucursalId ?? TODAS}
      onCambiar={(id) => onCambiar(id === TODAS ? undefined : id)}
    />
  );
}
