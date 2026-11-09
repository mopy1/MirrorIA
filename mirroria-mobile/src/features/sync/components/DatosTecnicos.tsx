import { useMutation } from '@tanstack/react-query';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { OutboxManager } from '@/lib/outbox/outbox-manager';
import type { FilaOutbox } from '@/lib/outbox/tipos';
import { useEstadoRed } from '@/lib/red/use-estado-red';

const Dato = ({ k, v }: { k: string; v: string }) => (
  <View className="flex-row justify-between gap-4 py-1">
    <Text className="text-xs text-muted-foreground">{k}</Text>
    <Text className="flex-1 text-right font-mono text-xs" selectable>
      {v}
    </Text>
  </View>
);

/** Lo que mira el docente: clave de idempotencia, HTTP, `X-Cache-Idempotency` y (solo `__DEV__`) el reenvío con la misma clave. */
export function DatosTecnicos({ fila }: { fila: FilaOutbox }) {
  const red = useEstadoRed();
  const reenviar = useMutation({ mutationFn: () => OutboxManager.reenviarMismaClave(fila) });
  return (
    <View className="mx-5 rounded-lg bg-muted/60 p-4">
      <Dato k="Idempotency-Key" v={fila.idempotencyKey} />
      <Dato k="Endpoint" v={`${fila.metodo} ${fila.endpoint.replace(/[0-9a-f-]{36}/, ':usuarioId')}`} />
      <Dato k="HTTP" v={fila.codigoRespuesta ? String(fila.codigoRespuesta) : '—'} />
      <Dato k="X-Cache-Idempotency" v={fila.cacheIdempotencia ?? '—'} />
      <Dato k="Reintentos" v={String(fila.reintentos)} />
      {__DEV__ && fila.estado === 'CONFIRMADA' ? (
        <View className="mt-3 gap-1.5 border-t border-border pt-3">
          <Button variant="outline" size="sm" disabled={!red.online || reenviar.isPending} onPress={() => reenviar.mutate()}>
            <Text>Reenviar con la misma clave</Text>
          </Button>
          {reenviar.data ? (
            <Text className="text-center font-mono text-xs text-muted-foreground">
              HTTP {reenviar.data.status} · {reenviar.data.cache ?? 'sin cabecera'} · venta {String(reenviar.data.cuerpo?.id ?? '—').slice(0, 8)}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
