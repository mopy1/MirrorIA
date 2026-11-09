import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { ApiError } from '@/src/lib/api';
import { AvisoError } from '@/src/features/admin-catalogo/components/form/Aviso';
import { Campo } from '@/src/features/admin-catalogo/components/form/Campo';
import { HojaInferior } from '@/src/features/admin-catalogo/components/form/HojaInferior';
import { SelectorChips } from '@/src/features/admin-catalogo/components/form/SelectorChips';
import type { Coleccion } from '@/src/features/admin-catalogo/types/catalogo-admin.types';
import type { Proveedor } from '@/src/features/admin-proveedores/types/proveedores.types';
import { inventarioApi } from '../api/inventarioApi';
import { armarPayloadOrden, proveedorDeVariante, variantesDelProveedor } from '../lib/ordenes';
import type { Sucursal, VarianteConProducto } from '../types/inventario.types';

export interface OrdenInicial {
  proveedorId?: string;
  sucursalId?: string;
  varianteId?: string;
}

interface Props {
  visible: boolean;
  onCerrar: () => void;
  proveedores: Proveedor[];
  sucursales: Sucursal[];
  variantes: VarianteConProducto[];
  colecciones: Coleccion[];
  inicial: OrdenInicial;
  onCreada: () => void;
}

/** Nueva orden de compra: proveedor, sucursal destino, prendas con cantidad y fecha esperada. */
export function CrearOrdenSheet({ visible, onCerrar, proveedores, sucursales, variantes, colecciones, inicial, onCreada }: Props) {
  const [proveedorId, setProveedorId] = useState('');
  const [sucursalId, setSucursalId] = useState('');
  const [fecha, setFecha] = useState('');
  const [cantidades, setCantidades] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    // Desde "Pedir" en el stock el proveedor se deduce de la colección de la prenda.
    const prov = inicial.proveedorId ?? (inicial.varianteId ? proveedorDeVariante(variantes, colecciones, inicial.varianteId) : '');
    setProveedorId(prov || (proveedores.length === 1 ? proveedores[0].id : ''));
    setSucursalId(inicial.sucursalId ?? sucursales[0]?.id ?? '');
    setCantidades(inicial.varianteId ? { [inicial.varianteId]: '10' } : {});
    setFecha('');
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const delProveedor = useMemo(() => variantesDelProveedor(variantes, colecciones, proveedorId), [variantes, colecciones, proveedorId]);
  const total = Object.values(cantidades).reduce((a, c) => a + (Number(c) > 0 ? Number(c) : 0), 0);

  async function crear() {
    const { dto, error: e } = armarPayloadOrden(proveedorId, sucursalId, cantidades, fecha.trim());
    if (!dto) return setError(e ?? null);
    setGuardando(true);
    setError(null);
    try {
      await inventarioApi.createOrden(dto);
      onCreada();
      onCerrar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear la orden de compra');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <HojaInferior
      aviso={<AvisoError mensaje={error} />}
      visible={visible}
      onCerrar={onCerrar}
      titulo="Nueva orden de compra"
      descripcion="Pedí reposición de prendas a un proveedor."
      pie={
        <>
          <Button variant="outline" className="flex-1 h-12" onPress={onCerrar}><Text>Cancelar</Text></Button>
          <Button className="flex-1 h-12" disabled={guardando} onPress={crear}><Text>{guardando ? 'Creando…' : `Crear orden (${total} u.)`}</Text></Button>
        </>
      }
    >
      <Campo etiqueta="Proveedor *">
        <SelectorChips
          opciones={proveedores.map((p) => ({ value: p.id, label: p.razonSocial }))}
          valor={proveedorId}
          onCambiar={(id) => {
            setProveedorId(id);
            setCantidades({});
          }}
          vacio="No hay proveedores: cargá uno en Proveedores."
        />
      </Campo>
      <Campo etiqueta="Sucursal destino *">
        <SelectorChips opciones={sucursales.map((s) => ({ value: s.id, label: s.nombre, detalle: s.ciudadNombre }))} valor={sucursalId} onCambiar={setSucursalId} enFila />
      </Campo>
      <Campo etiqueta="Prendas y cantidades *" ayuda="Solo aparecen las prendas de las colecciones de ese proveedor.">
        {!proveedorId ? (
          <Text className="text-xs text-muted-foreground">Elegí primero el proveedor.</Text>
        ) : delProveedor.length === 0 ? (
          <Text className="text-xs text-muted-foreground">Este proveedor no tiene prendas en el catálogo.</Text>
        ) : (
          <View className="rounded-xl border border-border">
            {delProveedor.map((v, i) => (
              <View key={v.varianteId} className={`flex-row items-center gap-2 px-3 py-2 ${i > 0 ? 'border-t border-border' : ''}`}>
                <View className="flex-1">
                  <Text className="text-sm" numberOfLines={1}>{v.productoTitulo}</Text>
                  <Text className="text-xs text-muted-foreground">Talla {v.tallaNombre} · {v.colorNombre}</Text>
                </View>
                <Input
                  value={cantidades[v.varianteId] ?? ''}
                  onChangeText={(t) => setCantidades((c) => ({ ...c, [v.varianteId]: t.replace(/[^0-9]/g, '') }))}
                  placeholder="0"
                  keyboardType="number-pad"
                  className="w-20 text-center"
                  accessibilityLabel={`Cantidad de ${v.productoTitulo} ${v.tallaNombre} ${v.colorNombre}`}
                />
              </View>
            ))}
          </View>
        )}
      </Campo>
      <Campo etiqueta="Fecha esperada (opcional)" ayuda="Formato AAAA-MM-DD, por ejemplo 2026-11-20.">
        <Input value={fecha} onChangeText={setFecha} placeholder="AAAA-MM-DD" keyboardType="numbers-and-punctuation" autoCorrect={false} />
      </Campo>
    </HojaInferior>
  );
}
