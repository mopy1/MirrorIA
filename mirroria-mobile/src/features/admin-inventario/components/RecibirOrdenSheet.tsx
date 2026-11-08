import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { ApiError } from '@/src/lib/api';
import { AvisoError } from '@/src/features/admin-catalogo/components/form/Aviso';
import { HojaInferior } from '@/src/features/admin-catalogo/components/form/HojaInferior';
import { inventarioApi } from '../api/inventarioApi';
import { armarPayloadRecepcion, cantidadesIniciales } from '../lib/ordenes';
import { nombreVariante } from '../lib/stock';
import type { OrdenCompra, VarianteConProducto } from '../types/inventario.types';

interface Props {
  orden: OrdenCompra | null;
  variantes: VarianteConProducto[];
  onCerrar: () => void;
  onRecibida: () => void;
}

/** Recepción de mercadería: cuántas prendas llegaron de cada variante (suma al stock de la sucursal destino). */
export function RecibirOrdenSheet({ orden, variantes, onCerrar, onRecibida }: Props) {
  const [cantidades, setCantidades] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const porId = new Map(variantes.map((v) => [v.varianteId, v]));

  useEffect(() => {
    if (orden) setCantidades(cantidadesIniciales(orden));
    setError(null);
  }, [orden]);

  const total = Object.values(cantidades).reduce((a, c) => a + (Number(c) || 0), 0);

  async function recibir() {
    if (!orden) return;
    const { dto, error: e } = armarPayloadRecepcion(orden, cantidades);
    if (!dto) return setError(e ?? null);
    setGuardando(true);
    setError(null);
    try {
      await inventarioApi.recibirOrden(orden.id, dto);
      onRecibida();
      onCerrar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al registrar la recepción de mercadería');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <HojaInferior
      aviso={<AvisoError mensaje={error} />}
      visible={!!orden}
      onCerrar={onCerrar}
      titulo="Recepción de mercadería"
      descripcion={orden ? `Orden #${orden.id.slice(0, 8)}: anotá las prendas que llegaron.` : undefined}
      pie={
        <>
          <Button variant="outline" className="flex-1 h-12" onPress={onCerrar}><Text>Cancelar</Text></Button>
          <Button className="flex-1 h-12" disabled={guardando || total <= 0} onPress={recibir}>
            <Text>{guardando ? 'Recibiendo…' : `Confirmar (${total} u.)`}</Text>
          </Button>
        </>
      }
    >
      {orden?.items.map((i) => {
        const falta = i.cantidadPedida - i.cantidadRecibida;
        return (
          <View key={i.varianteId} className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text className="text-sm" numberOfLines={1}>{nombreVariante(porId.get(i.varianteId), i.varianteId)}</Text>
              <Text className="text-xs text-muted-foreground">Pedidas {i.cantidadPedida} · llegaron {i.cantidadRecibida} · faltan {falta}</Text>
            </View>
            <Input
              value={cantidades[i.varianteId] ?? ''}
              onChangeText={(t) => setCantidades((c) => ({ ...c, [i.varianteId]: t.replace(/[^0-9]/g, '') }))}
              editable={falta > 0}
              keyboardType="number-pad"
              className="w-20 text-center"
            />
          </View>
        );
      })}
    </HojaInferior>
  );
}
