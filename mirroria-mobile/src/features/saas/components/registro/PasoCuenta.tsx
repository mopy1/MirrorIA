import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import type { RegistroTienda } from '../../hooks/useRegistroTienda';
import { precioPlanBs } from '../../lib/limites';
import type { PlanDto } from '../../types/saas.types';
import { Campo } from '../Campo';

/** Paso 3: la cuenta de la dueña (queda como ADMIN de la tienda) y el resumen. */
export function PasoCuenta({ r, plan }: { r: RegistroTienda; plan?: PlanDto }) {
  const { form, errores: e, set } = r;
  return (
    <View className="gap-4">
      <Campo label="Tu nombre completo" value={form.admin.fullName} onChangeText={(v) => set('admin', 'fullName', v)} error={e['admin.fullName']} autoComplete="name" />
      <Campo label="Email" value={form.admin.email} onChangeText={(v) => set('admin', 'email', v)} error={e['admin.email']} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <Campo label="Contraseña" value={form.admin.password} onChangeText={(v) => set('admin', 'password', v)} error={e['admin.password']} secureTextEntry ayuda="Mínimo 8 caracteres." />
      <View className="gap-1 rounded-2xl bg-muted/50 p-4">
        <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resumen</Text>
        <Text className="text-sm text-foreground">Tienda: {form.tienda.nombre || '—'} (/t/{form.tienda.slug || '…'})</Text>
        <Text className="text-sm text-foreground">Sucursal: {form.sucursal.nombre || '—'}</Text>
        {plan && (
          <Text className="text-sm text-foreground">
            Plan {plan.nombre}: {plan.diasPrueba} días gratis, después {precioPlanBs(plan.precioMensualCents)}/mes
          </Text>
        )}
      </View>
    </View>
  );
}
