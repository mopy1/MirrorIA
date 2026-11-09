import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ApiError } from '@/src/lib/api';
import { AvisoError } from '@/src/features/admin-catalogo/components/form/Aviso';
import { HojaInferior } from '@/src/features/admin-catalogo/components/form/HojaInferior';
import { inventarioApi } from '../api/inventarioApi';
import { pendientes } from '../lib/ordenes';
import type { OrdenCompra } from '../types/inventario.types';

/** Confirmación para cancelar una orden abierta: lo que faltaba llegar deja de figurar "en camino". */
export function CancelarOrdenSheet({ orden, proveedor, onCerrar, onCancelada }: { orden: OrdenCompra | null; proveedor?: string; onCerrar: () => void; onCancelada: () => void }) {
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setError(null), [orden]);

  async function cancelar() {
    if (!orden) return;
    setOcupado(true);
    try {
      await inventarioApi.cancelarOrden(orden.id);
      onCancelada();
      onCerrar();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo cancelar la orden');
    } finally {
      setOcupado(false);
    }
  }

  return (
    <HojaInferior
      aviso={<AvisoError mensaje={error} />}
      visible={!!orden}
      onCerrar={onCerrar}
      titulo="¿Cancelar esta orden?"
      pie={
        <>
          <Button variant="outline" className="flex-1 h-12" onPress={onCerrar}><Text>Volver</Text></Button>
          <Button variant="destructive" className="flex-1 h-12" disabled={ocupado} onPress={cancelar}><Text>{ocupado ? 'Cancelando…' : 'Cancelar orden'}</Text></Button>
        </>
      }
    >
      <Text className="text-sm">
        {orden ? `La orden a ${proveedor ?? 'el proveedor'} queda cancelada y las ${pendientes(orden)} u. que faltaban dejan de figurar en camino. Lo ya recibido se conserva.` : ''}
      </Text>
    </HojaInferior>
  );
}
