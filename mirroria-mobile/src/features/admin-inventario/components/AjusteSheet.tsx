import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ApiError } from '@/src/lib/api';
import { AvisoError } from '@/src/features/admin-catalogo/components/form/Aviso';
import { Campo, CampoTexto } from '@/src/features/admin-catalogo/components/form/Campo';
import { HojaInferior } from '@/src/features/admin-catalogo/components/form/HojaInferior';
import { SelectorChips } from '@/src/features/admin-catalogo/components/form/SelectorChips';
import { SelectorLista } from '@/src/features/admin-catalogo/components/form/SelectorLista';
import { inventarioApi } from '../api/inventarioApi';
import { ajusteSchema, armarPayloadAjuste, quedariaNegativo, type AjusteFormValues } from '../lib/stock';
import type { InventarioSucursal, Sucursal, VarianteConProducto } from '../types/inventario.types';

const MOTIVOS = ['Conteo físico', 'Ingreso de mercadería', 'Merma o prenda dañada', 'Corrección de carga'];

interface Props {
  visible: boolean;
  onCerrar: () => void;
  variantes: VarianteConProducto[];
  sucursales: Sucursal[];
  /** Stock de la sucursal actual, para mostrar cuánto queda después del ajuste. */
  filas: InventarioSucursal[];
  inicial: { varianteId?: string; sucursalId?: string };
  onAjustado: (mensaje: string) => void;
}

/** Ajuste manual de stock: entradas, mermas o correcciones de conteo (POST /inventario/ajustes). */
export function AjusteSheet({ visible, onCerrar, variantes, sucursales, filas, inicial, onAjustado }: Props) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<AjusteFormValues>({
    resolver: zodResolver(ajusteSchema),
    defaultValues: { varianteId: '', sucursalId: '', cantidad: '', motivo: '' },
  });

  useEffect(() => {
    if (!visible) return;
    setError(null);
    reset({ varianteId: inicial.varianteId ?? '', sucursalId: inicial.sucursalId ?? (sucursales.length === 1 ? sucursales[0].id : ''), cantidad: '', motivo: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, inicial.varianteId, inicial.sucursalId]);

  const [varianteId, sucursalId, cantidad] = watch(['varianteId', 'sucursalId', 'cantidad']);
  const actual = filas.find((f) => f.varianteId === varianteId && f.sucursalId === sucursalId)?.cantidadDisponible;
  const delta = Number(cantidad);
  // Solo hay números de la sucursal que se está mirando; de otra no se adivina.
  const conDatos = filas.some((f) => f.sucursalId === sucursalId);
  const negativo = conDatos && quedariaNegativo(actual ?? 0, cantidad);

  const enviar = handleSubmit(async (v) => {
    setGuardando(true);
    setError(null);
    try {
      const r = await inventarioApi.ajustarStock(armarPayloadAjuste(v));
      onAjustado(`Ajuste aplicado: nuevo stock disponible ${r.cantidadDisponible} u.`);
      onCerrar();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo aplicar el ajuste');
    } finally {
      setGuardando(false);
    }
  });

  return (
    <HojaInferior
      aviso={<AvisoError mensaje={error} />}
      visible={visible}
      onCerrar={onCerrar}
      titulo="Ajuste manual de stock"
      descripcion="Registrá entradas, mermas o correcciones de conteo."
      pie={
        <>
          <Button variant="outline" className="flex-1 h-12" onPress={onCerrar}><Text>Cancelar</Text></Button>
          <Button className="flex-1 h-12" disabled={guardando} onPress={enviar}><Text>{guardando ? 'Aplicando…' : 'Aplicar ajuste'}</Text></Button>
        </>
      }
    >
      <Campo etiqueta="Prenda y variante *" error={errors.varianteId?.message}>
        <Controller control={control} name="varianteId" render={({ field }) => (
          <SelectorLista
            opciones={variantes.map((v) => ({ value: v.varianteId, label: v.productoTitulo, detalle: `Talla ${v.tallaNombre} · ${v.colorNombre} · ${v.sku}` }))}
            valor={field.value}
            onCambiar={field.onChange}
            placeholder="Buscar prenda, talla o color…"
            maximo={4}
          />
        )} />
      </Campo>
      {sucursales.length > 1 ? (
        <Campo etiqueta="Sucursal *" error={errors.sucursalId?.message}>
          <Controller control={control} name="sucursalId" render={({ field }) => (
            <SelectorChips opciones={sucursales.map((s) => ({ value: s.id, label: s.nombre, detalle: s.ciudadNombre }))} valor={field.value} onCambiar={field.onChange} enFila />
          )} />
        </Campo>
      ) : (
        <Text className="text-sm text-muted-foreground">Sucursal: {sucursales[0]?.nombre ?? '—'}</Text>
      )}
      <CampoTexto
        control={control}
        name="cantidad"
        etiqueta="Cantidad (+ ingreso, − egreso) *"
        placeholder="Ej. 10 o -2"
        keyboardType="numbers-and-punctuation"
        ayuda="Usá números negativos para pérdidas o mermas."
        error={errors.cantidad?.message}
      />
      {varianteId && conDatos && Number.isInteger(delta) && delta !== 0 ? (
        <View className={`rounded-xl p-3 ${negativo ? 'bg-destructive/10' : 'bg-muted'}`}>
          <Text className={`text-sm ${negativo ? 'text-destructive' : ''}`}>
            Hoy hay {actual ?? 0} u. → quedarían {(actual ?? 0) + delta} u.{negativo ? ' No alcanza el stock para restar eso.' : ''}
          </Text>
        </View>
      ) : null}
      <CampoTexto control={control} name="motivo" etiqueta="Motivo del ajuste *" placeholder="Ej. Conteo físico mensual" error={errors.motivo?.message} />
      <SelectorChips opciones={MOTIVOS.map((m) => ({ value: m, label: m }))} valor={watch('motivo')} onCambiar={(m) => setValue('motivo', m, { shouldValidate: true })} />
    </HojaInferior>
  );
}
