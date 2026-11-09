import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { CheckCircle2, XCircle } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { CODIGOS_PALETA, PALETAS } from '../../../appearance/lib/marca.constants';
import type { EstadoSlug } from '../../hooks/useDisponibilidadSlug';
import type { RegistroTienda } from '../../hooks/useRegistroTienda';
import type { Ciudad } from '../../types/saas.types';
import { Campo } from '../Campo';

interface Props {
  r: RegistroTienda;
  estadoSlug: EstadoSlug;
  ciudades: Ciudad[];
}

function EstadoDireccion({ estado }: { estado: EstadoSlug }) {
  if (estado.tipo === 'verificando') return <ActivityIndicator size="small" />;
  if (estado.tipo === 'disponible') return <Icon as={CheckCircle2} size={20} className="text-emerald-600" />;
  if (estado.tipo === 'no-disponible' || estado.tipo === 'invalido') return <Icon as={XCircle} size={20} className="text-destructive" />;
  return null;
}

/** Paso 2: nombre y dirección de la tienda, paleta inicial y primera sucursal. */
export function PasoTienda({ r, estadoSlug, ciudades }: Props) {
  const { form, errores: e, set } = r;
  const errorSlug =
    e['tienda.slug'] ??
    (estadoSlug.tipo === 'no-disponible' || estadoSlug.tipo === 'invalido' ? estadoSlug.mensaje : undefined);
  const ayudaSlug = estadoSlug.tipo === 'disponible' ? '¡Disponible!' : 'Así te van a encontrar tus clientas.';

  return (
    <View className="gap-4">
      <Campo label="Nombre de la tienda" value={form.tienda.nombre} onChangeText={(v) => set('tienda', 'nombre', v)} error={e['tienda.nombre']} placeholder="Boutique Luna" />
      <Campo
        label="Dirección de tu tienda"
        prefijo="/t/"
        value={form.tienda.slug}
        onChangeText={(v) => set('tienda', 'slug', v.toLowerCase())}
        error={errorSlug}
        ayuda={ayudaSlug}
        autoCapitalize="none"
        autoCorrect={false}
        derecha={<EstadoDireccion estado={estadoSlug} />}
      />
      <View className="gap-1.5">
        <Text className="text-sm font-medium text-foreground">Colores iniciales</Text>
        <View className="flex-row flex-wrap gap-2">
          {CODIGOS_PALETA.map((c) => (
            <Pressable
              key={c}
              onPress={() => r.setPaleta(c)}
              aria-pressed={form.tienda.paleta === c}
              className={cn('flex-row items-center gap-1.5 rounded-full border px-3 py-1.5', form.tienda.paleta === c ? 'border-primary bg-primary/5' : 'border-border')}
            >
              <View className="h-4 w-4 rounded-full" style={{ backgroundColor: PALETAS[c].primario }} />
              <Text className="text-xs text-foreground">{PALETAS[c].nombre}</Text>
            </Pressable>
          ))}
        </View>
        <Text className="text-xs text-muted-foreground">Después los cambiás cuando quieras en Apariencia.</Text>
      </View>

      <View className="mt-1 gap-4 border-t border-border pt-4">
        <Text className="text-sm font-semibold text-foreground">Tu primera sucursal</Text>
        <Campo label="Nombre de la sucursal" value={form.sucursal.nombre} onChangeText={(v) => set('sucursal', 'nombre', v)} error={e['sucursal.nombre']} placeholder="Central" />
        <Campo label="Dirección" value={form.sucursal.direccion} onChangeText={(v) => set('sucursal', 'direccion', v)} error={e['sucursal.direccion']} placeholder="Av. 6 de Agosto 1234" />
        <View className="gap-1.5">
          <Text className="text-sm font-medium text-foreground">Ciudad</Text>
          <View className="flex-row flex-wrap gap-2">
            {ciudades.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => set('sucursal', 'ciudadId', c.id)}
                aria-pressed={form.sucursal.ciudadId === c.id}
                className={cn('rounded-full border px-3 py-1.5', form.sucursal.ciudadId === c.id ? 'border-primary bg-primary' : 'border-border')}
              >
                <Text className={cn('text-xs', form.sucursal.ciudadId === c.id ? 'text-primary-foreground' : 'text-foreground')}>{c.nombre}</Text>
              </Pressable>
            ))}
          </View>
          {e['sucursal.ciudadId'] ? <Text className="text-xs text-destructive">{e['sucursal.ciudadId']}</Text> : null}
        </View>
        <Campo label="Teléfono (opcional)" value={form.sucursal.telefono} onChangeText={(v) => set('sucursal', 'telefono', v)} keyboardType="phone-pad" placeholder="70012345" />
      </View>
    </View>
  );
}
