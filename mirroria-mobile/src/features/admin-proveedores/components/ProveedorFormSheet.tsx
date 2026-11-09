import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ApiError } from '@/src/lib/api';
import { AvisoError } from '@/src/features/admin-catalogo/components/form/Aviso';
import { CampoTexto } from '@/src/features/admin-catalogo/components/form/Campo';
import { HojaInferior } from '@/src/features/admin-catalogo/components/form/HojaInferior';
import { proveedoresApi } from '../api/proveedoresApi';
import { armarPayloadProveedor, PROVEEDOR_VACIO, proveedorSchema, type ProveedorFormValues } from '../lib/proveedor-form';
import type { Proveedor } from '../types/proveedores.types';

/** Alta de proveedor (los mismos campos que la web). */
export function ProveedorFormSheet({ visible, onCerrar, onCreado }: { visible: boolean; onCerrar: () => void; onCreado: (p: Proveedor) => void }) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, reset, formState: { errors } } = useForm<ProveedorFormValues>({
    resolver: zodResolver(proveedorSchema),
    defaultValues: PROVEEDOR_VACIO,
  });

  useEffect(() => {
    if (visible) {
      reset(PROVEEDOR_VACIO);
      setError(null);
    }
  }, [visible, reset]);

  const enviar = handleSubmit(async (v) => {
    setGuardando(true);
    setError(null);
    try {
      const p = await proveedoresApi.createProveedor(armarPayloadProveedor(v));
      onCreado(p);
      onCerrar();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo crear el proveedor');
    } finally {
      setGuardando(false);
    }
  });

  return (
    <HojaInferior
      aviso={<AvisoError mensaje={error} />}
      visible={visible}
      onCerrar={onCerrar}
      titulo="Nuevo proveedor"
      descripcion="Fabricante o distribuidor de prendas y accesorios."
      pie={
        <>
          <Button variant="outline" className="flex-1 h-12" onPress={onCerrar}><Text>Cancelar</Text></Button>
          <Button className="flex-1 h-12" disabled={guardando} onPress={enviar}><Text>{guardando ? 'Guardando…' : 'Crear proveedor'}</Text></Button>
        </>
      }
    >
      <CampoTexto control={control} name="razonSocial" etiqueta="Razón social *" placeholder="Ej. Textiles del Sur SRL" error={errors.razonSocial?.message} />
      <CampoTexto control={control} name="nit" etiqueta="NIT" placeholder="Ej. 1020304025" keyboardType="number-pad" error={errors.nit?.message} />
      <CampoTexto control={control} name="contactoNombre" etiqueta="Nombre de contacto" placeholder="Ej. Marta Quispe" error={errors.contactoNombre?.message} />
      <CampoTexto control={control} name="contactoEmail" etiqueta="Email de contacto" placeholder="ventas@proveedor.bo" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} error={errors.contactoEmail?.message} />
      <CampoTexto control={control} name="contactoTelefono" etiqueta="Teléfono de contacto" placeholder="+591 7 000 0000" keyboardType="phone-pad" error={errors.contactoTelefono?.message} />
    </HojaInferior>
  );
}
