import { useMutation } from '@tanstack/react-query';
import * as React from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { mensajeDeError } from '@/lib/api/errores';
import { formatoBs } from '@/lib/formato/dinero';
import { validarCupon } from '../api/carrito.api';

interface Props {
  subtotalCents: number;
  online: boolean;
  aplicado: { codigo: string; descuentoCents: number } | null;
  onAplicar: (c: { codigo: string; descuentoCents: number } | null) => void;
}

/** Cupón opcional: validarlo necesita red (spec §5.3); sin red se compra sin cupón. */
export function CampoCupon({ subtotalCents, online, aplicado, onAplicar }: Props) {
  const [codigo, setCodigo] = React.useState('');
  const validar = useMutation({
    mutationFn: () => validarCupon(codigo.trim().toUpperCase(), subtotalCents),
    onSuccess: (r) => onAplicar(r.valido ? { codigo: codigo.trim().toUpperCase(), descuentoCents: r.descuentoCents } : null),
  });
  const invalido = validar.data && !validar.data.valido;

  if (aplicado) {
    return (
      <View className="flex-row items-center justify-between rounded-lg bg-success/10 px-4 py-3">
        <Text className="font-mono text-sm text-success">{aplicado.codigo} · −{formatoBs(aplicado.descuentoCents)}</Text>
        <Button variant="ghost" size="sm" onPress={() => onAplicar(null)}>
          <Text>Quitar</Text>
        </Button>
      </View>
    );
  }
  return (
    <View className="gap-1.5">
      <View className="flex-row gap-2">
        <Input className="flex-1 font-mono" placeholder="Código de cupón" autoCapitalize="characters" value={codigo} onChangeText={setCodigo} editable={online} />
        <Button variant="outline" disabled={!online || !codigo.trim() || validar.isPending} onPress={() => validar.mutate()}>
          <Text>Aplicar</Text>
        </Button>
      </View>
      {!online ? <Text className="text-xs text-muted-foreground">Para usar un cupón necesitás conexión.</Text> : null}
      {invalido ? <Text className="text-xs text-danger">{validar.data?.mensaje ?? 'Ese cupón no es válido'}</Text> : null}
      {validar.error ? <Text className="text-xs text-danger">{mensajeDeError(validar.error)}</Text> : null}
    </View>
  );
}
