import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { CheckCircle2, Circle } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/src/lib/money';
import { Aviso } from '../../saas/components/Aviso';
import { usePagoWayra } from '../hooks/usePagoWayra';

/**
 * Banco simulado Wayra dentro de la app: hace lo mismo que escanear el QR con
 * otro celular (elegir cuenta, PIN, comprobante). El aviso del banco acredita
 * la suscripción y la hoja del QR cambia sola.
 */
export function BancoWayra({ token }: { token?: string }) {
  const w = usePagoWayra(token);
  if (!token) return null;

  if (w.paso === 'cerrado') {
    return (
      <View className="gap-2">
        <Button variant="outline" onPress={w.abrir}>
          <Text>Pagar con la app del banco Wayra (prueba)</Text>
        </Button>
        {w.error && <Aviso tono="error" texto={w.error} />}
      </View>
    );
  }

  return (
    <View className="gap-3 rounded-2xl border border-emerald-600/30 bg-emerald-500/5 p-4">
      <Text className="text-sm font-bold text-emerald-800">Banco Wayra · pago con QR</Text>
      {w.paso === 'cargando' && <ActivityIndicator />}
      {w.cobro && w.paso !== 'comprobante' && (
        <>
          <Text className="text-sm text-foreground">
            {w.cobro.comercio} · {w.cobro.referencia}
          </Text>
          <Text className="text-xl font-bold text-foreground">{formatMoney(w.cobro.montoCents)}</Text>
          {w.cobro.estado !== 'PENDIENTE' ? (
            <Aviso tono="info" texto={w.cobro.estado === 'PAGADO' ? 'Este QR ya fue pagado.' : 'Este QR venció.'} />
          ) : (
            <>
              <Text className="text-xs text-muted-foreground">Cuenta de {w.cobro.titular}:</Text>
              {w.cobro.cuentas.map((c) => (
                <Pressable key={c.id} onPress={() => w.setCuentaId(c.id)} className={cn('flex-row items-center gap-2 rounded-xl border p-3', w.cuentaId === c.id ? 'border-emerald-600' : 'border-border')}>
                  <Icon as={w.cuentaId === c.id ? CheckCircle2 : Circle} size={18} className={w.cuentaId === c.id ? 'text-emerald-700' : 'text-muted-foreground'} />
                  <Text className="flex-1 text-sm text-foreground">{c.tipo} {c.numeroEnmascarado}</Text>
                  <Text className="text-xs text-muted-foreground">{formatMoney(c.saldoCents)}</Text>
                </Pressable>
              ))}
              <Input value={w.pin} onChangeText={(v) => w.setPin(v.replace(/\D/g, '').slice(0, 4))} placeholder="PIN de 4 dígitos (cualquiera)" keyboardType="number-pad" secureTextEntry maxLength={4} />
              <Button onPress={w.pagar} disabled={w.paso === 'procesando' || w.pin.length !== 4}>
                <Text>{w.paso === 'procesando' ? 'Pagando…' : `Pagar ${formatMoney(w.cobro.montoCents)}`}</Text>
              </Button>
            </>
          )}
        </>
      )}
      {w.paso === 'comprobante' && w.comprobante && (
        <View className="gap-1">
          <Text className="text-sm font-semibold text-emerald-800">Pago realizado</Text>
          <Text selectable className="text-xs text-muted-foreground">Transacción {w.comprobante.transaccion}</Text>
          <Text className="text-xs text-muted-foreground">Desde {w.comprobante.cuentaOrigen}</Text>
        </View>
      )}
      {w.error && <Aviso tono="error" texto={w.error} />}
    </View>
  );
}
