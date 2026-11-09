import React, { useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useGuardarProducto } from '../hooks/useGuardarProducto';
import { PRODUCTO_VACIO, productoSchema, valoresDesdeProducto, type ProductoFormValues } from '../lib/producto-form';
import { slugDesdeTitulo } from '../lib/texto';
import type { Categoria, Coleccion, Producto, Temporada } from '../types/catalogo-admin.types';
import { AvisoError } from './form/Aviso';
import { Campo, CampoTexto } from './form/Campo';
import { HojaInferior } from './form/HojaInferior';
import { SelectorChips } from './form/SelectorChips';
import { ImagenesUrlCampo } from './ImagenesUrlCampo';

interface Props {
  visible: boolean;
  onCerrar: () => void;
  /** Sin producto: alta. Con producto: edición. */
  producto?: Producto | null;
  categorias: Categoria[];
  colecciones: Coleccion[];
  temporadas: Temporada[];
  onGuardado: (p: Producto) => void;
}

/** Alta y edición de prenda: datos, precio, categoría, colección (con su temporada) y fotos. */
export function ProductoFormSheet({ visible, onCerrar, producto, categorias, colecciones, temporadas, onGuardado }: Props) {
  const { guardar, guardando, error, limpiarError } = useGuardarProducto();
  const slugTocado = useRef(false);
  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<ProductoFormValues>({
    resolver: zodResolver(productoSchema),
    defaultValues: PRODUCTO_VACIO,
  });

  useEffect(() => {
    if (!visible) return;
    limpiarError();
    slugTocado.current = !!producto;
    reset(producto ? valoresDesdeProducto(producto) : { ...PRODUCTO_VACIO, coleccionId: colecciones.length === 1 ? colecciones[0].id : '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, producto?.id]);

  const temporadaDe = (c: Coleccion) => temporadas.find((t) => t.id === c.temporadaId)?.nombre;

  const enviar = handleSubmit(async (valores) => {
    const guardado = await guardar(valores, producto ?? undefined);
    if (guardado) {
      onGuardado(guardado);
      onCerrar();
    }
  });

  return (
    <HojaInferior
      aviso={<AvisoError mensaje={error} />}
      visible={visible}
      onCerrar={onCerrar}
      titulo={producto ? 'Editar prenda' : 'Nueva prenda'}
      descripcion={producto ? 'Cambiá datos, precio, categoría o fotos.' : 'Registrá una prenda para venderla online y en tienda.'}
      pie={
        <>
          <Button variant="outline" className="flex-1 h-12" onPress={onCerrar}>
            <Text>Cancelar</Text>
          </Button>
          <Button className="flex-1 h-12" disabled={guardando} onPress={enviar}>
            <Text>{guardando ? 'Guardando…' : producto ? 'Guardar cambios' : 'Crear prenda'}</Text>
          </Button>
        </>
      }
    >
      <CampoTexto
        control={control}
        name="titulo"
        etiqueta="Nombre de la prenda *"
        placeholder="Ej. Vestido Gala Seda"
        error={errors.titulo?.message}
        alCambiar={(t) => !slugTocado.current && setValue('slug', slugDesdeTitulo(t))}
      />
      <CampoTexto
        control={control}
        name="slug"
        etiqueta="Identificador web *"
        placeholder="vestido-gala-seda"
        autoCapitalize="none"
        autoCorrect={false}
        ayuda="Va en el enlace de la prenda. Se arma solo con el nombre."
        error={errors.slug?.message}
        alCambiar={() => (slugTocado.current = true)}
      />
      <CampoTexto control={control} name="precio" etiqueta="Precio de venta (Bs) *" placeholder="Ej. 180" keyboardType="decimal-pad" error={errors.precio?.message} />
      <Campo etiqueta="Categoría *" error={errors.categoriaId?.message}>
        <Controller control={control} name="categoriaId" render={({ field }) => (
          <SelectorChips opciones={categorias.map((c) => ({ value: c.id, label: c.nombre }))} valor={field.value} onCambiar={field.onChange} invalido={!!errors.categoriaId} />
        )} />
      </Campo>
      <Campo etiqueta="Colección y temporada *" error={errors.coleccionId?.message}>
        <Controller control={control} name="coleccionId" render={({ field }) => (
          <SelectorChips
            opciones={colecciones.filter((c) => c.activo || c.id === field.value).map((c) => ({ value: c.id, label: c.nombre, detalle: temporadaDe(c) }))}
            valor={field.value}
            onCambiar={field.onChange}
            invalido={!!errors.coleccionId}
            vacio="No hay colecciones: creá una desde la web."
          />
        )} />
      </Campo>
      <Campo etiqueta="Descripción">
        <Controller control={control} name="descripcion" render={({ field }) => (
          <Input value={field.value} onChangeText={field.onChange} multiline numberOfLines={4} textAlignVertical="top" placeholder="Tela, corte y estilo…" className="h-24 py-2" />
        )} />
      </Campo>
      <ImagenesUrlCampo control={control} errors={errors} />
    </HojaInferior>
  );
}
