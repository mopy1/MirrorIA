import React from 'react';
import { View } from 'react-native';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, type LucideIcon } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

export type TonoAviso = 'exito' | 'info' | 'error' | 'alerta';

const ESTILO: Record<TonoAviso, { caja: string; texto: string; icono: LucideIcon }> = {
  exito: { caja: 'border-emerald-500/30 bg-emerald-500/10', texto: 'text-emerald-800', icono: CheckCircle2 },
  info: { caja: 'border-border bg-muted/50', texto: 'text-foreground', icono: Info },
  error: { caja: 'border-destructive/30 bg-destructive/10', texto: 'text-destructive', icono: AlertCircle },
  alerta: { caja: 'border-amber-500/30 bg-amber-500/10', texto: 'text-amber-800', icono: TriangleAlert },
};

interface Props {
  tono: TonoAviso;
  texto: string;
  accion?: { label: string; onPress: () => void; deshabilitada?: boolean };
  className?: string;
}

/** Recuadro de aviso con ícono y, opcionalmente, una acción (Reintentar, Revisar de nuevo…). */
export function Aviso({ tono, texto, accion, className }: Props) {
  const e = ESTILO[tono];
  return (
    <View role="alert" className={cn('gap-2.5 rounded-xl border p-3', e.caja, className)}>
      <View className="flex-row items-start gap-2">
        <Icon as={e.icono} size={16} className={cn('mt-0.5', e.texto)} />
        <Text className={cn('flex-1 text-sm', e.texto)}>{texto}</Text>
      </View>
      {accion ? (
        <Button size="sm" variant="outline" onPress={accion.onPress} disabled={accion.deshabilitada} className="self-start">
          <Text>{accion.label}</Text>
        </Button>
      ) : null}
    </View>
  );
}
