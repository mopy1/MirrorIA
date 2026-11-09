import React, { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ApiError } from '@/src/lib/api';
import { catalogoAdminApi } from '../api/catalogoAdminApi';
import { armarPayloadVariante, combinacionRepetida, skuSugerido, VARIANTE_VACIA, varianteSchema, type VarianteFormValues } from '../lib/variante-form';
import type { Color, Producto, Talla } from '../types/catalogo-admin.types';
import { AvisoError } from './form/Aviso';
import { Campo, CampoTexto } from './form/Campo';
import { HojaInferior } from './form/HojaInferior';
import { SelectorChips } from './form/SelectorChips';

interface Props {
  visible: boolean;
  onCerrar: () => void;
  producto: Producto;
  tallas: Talla[];
  colores: Color[];
  onCreada: () => void;
}

/** Nueva variante (talla + color + SKU) de una prenda. */
export function VarianteFormSheet({ visible, onCerrar, producto, tallas, colores, onCreada }: Props) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skuTocado = useRef(false);
  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<VarianteFormValues>({
    resolver: zodResolver(varianteSchema),
    defaultValues: VARIANTE_VACIA,
  });
  const tallaId = watch('tallaId');
  const colorId = watch('colorId');

  useEffect(() => {
    if (!visible) return;
    reset(VARIANTE_VACIA);
    setError(null);
    skuTocado.current = false;
  }, [visible, reset]);

  useEffect(() => {
    if (skuTocado.current) return;
    const talla = tallas.find((t) => t.id === tallaId)?.nombre;
    const color = colores.find((c) => c.id === colorId)?.nombre;
    if (talla || color) setValue('sku', skuSugerido(producto.slug, talla, color));
  }, [tallaId, colorId, tallas, colores, producto.slug, setValue]);

  const repetida = !!tallaId && !!colorId && combinacionRepetida(producto.variantes ?? [], tallaId, colorId);

  const enviar = handleSubmit(async (valores) => {
    if (repetida) return;
    setGuardando(true);
    setError(null);
    try {
      await catalogoAdminApi.createVariante(producto.id, armarPayloadVariante(valores));
      onCreada();
      onCerrar();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo crear la variante');
    } finally {
      setGuardando(false);
    }
  });

  return (
    <HojaInferior
      aviso={<AvisoError mensaje={repetida ? 'Esta prenda ya tiene una variante con esa talla y ese color.' : error} />}
      visible={visible}
      onCerrar={onCerrar}
      titulo="Nueva variante"
      descripcion={`${producto.titulo}: elegí talla y color.`}
      pie={
        <>
          <Button variant="outline" className="flex-1 h-12" onPress={onCerrar}>
            <Text>Cancelar</Text>
          </Button>
          <Button className="flex-1 h-12" disabled={guardando || repetida} onPress={enviar}>
            <Text>{guardando ? 'Guardando…' : 'Guardar variante'}</Text>
          </Button>
        </>
      }
    >
      <Campo etiqueta="Talla *" error={errors.tallaId?.message}>
        <Controller control={control} name="tallaId" render={({ field }) => (
          <SelectorChips opciones={[...tallas].sort((a, b) => a.orden - b.orden).map((t) => ({ value: t.id, label: t.nombre }))} valor={field.value} onCambiar={field.onChange} invalido={!!errors.tallaId} />
        )} />
      </Campo>
      <Campo etiqueta="Color *" error={errors.colorId?.message}>
        <Controller control={control} name="colorId" render={({ field }) => (
          <SelectorChips opciones={colores.map((c) => ({ value: c.id, label: c.nombre }))} valor={field.value} onCambiar={field.onChange} invalido={!!errors.colorId} />
        )} />
      </Campo>
      <CampoTexto
        control={control}
        name="sku"
        etiqueta="Código único (SKU) *"
        placeholder="Ej. VESTIDO-GALA-M-ROJO"
        autoCapitalize="characters"
        autoCorrect={false}
        ayuda="Se sugiere solo; podés cambiarlo."
        error={errors.sku?.message}
        alCambiar={() => (skuTocado.current = true)}
      />
    </HojaInferior>
  );
}
