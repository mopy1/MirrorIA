import React, { useState } from 'react';
import { View } from 'react-native';
import { CircleAlert } from 'lucide-react-native';
import { PantallaAdmin } from '@/components/admin/PantallaAdmin';
import { Cargando, ErrorVista, Vacio } from '@/components/admin/Estados';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ApiError } from '@/src/lib/api';
import { formatMoney } from '@/src/lib/money';
import { staffApi } from '../api/staffApi';
import { Aviso } from '../components/Aviso';
import { EstadoBadge } from '../components/EstadoBadge';
import { useRecurso } from '../hooks/useRecurso';
import { codigoCorto } from '../lib/codigo';
import { METODO_PAGO } from '../lib/etiquetas';
import type { Pago } from '../types/staff.types';

const fecha = (iso: string) => new Date(iso).toLocaleString('es-BO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

function TarjetaCobro({ pago, confirmando, onConfirmar }: { pago: Pago; confirmando: boolean; onConfirmar: () => void }) {
  // Dos toques: un toque sin querer no da por cobrada una plata que no entró.
  const [seguro, setSeguro] = useState(false);
  return (
    <View className="gap-3 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-start justify-between gap-2">
        <View className="gap-1">
          <Text className="text-2xl font-bold">{formatMoney(pago.montoCents)}</Text>
          <Text className="text-sm text-muted-foreground">Compra <Text className="font-mono font-semibold">#{codigoCorto(pago.ventaId)}</Text> · {fecha(pago.createdAt)}</Text>
        </View>
        <EstadoBadge label={METODO_PAGO[pago.metodo] ?? pago.metodo} tono="gris" />
      </View>
      {seguro ? (
        <View className="gap-2">
          <Text className="text-sm">¿Recibiste {formatMoney(pago.montoCents)} de la compra #{codigoCorto(pago.ventaId)}?</Text>
          <View className="flex-row gap-2">
            <Button className="flex-1 h-12" disabled={confirmando} onPress={onConfirmar}>
              <Text>{confirmando ? 'Confirmando…' : 'Sí, confirmar'}</Text>
            </Button>
            <Button variant="outline" className="h-12" onPress={() => setSeguro(false)}>
              <Text>No</Text>
            </Button>
          </View>
        </View>
      ) : (
        <Button variant="outline" className="h-12" onPress={() => setSeguro(true)}>
          <Text>Confirmar cobro</Text>
        </Button>
      )}
    </View>
  );
}

/** `/admin/cobros`: pagos en efectivo que la clienta declaró y esperan que caja los confirme (como la web). */
export function CobrosScreen() {
  const pagos = useRecurso(staffApi.pagosPendientes, [] as Pago[]);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function confirmar(id: string) {
    setConfirmandoId(id);
    setError(null);
    try {
      await staffApi.confirmarPago(id);
      pagos.setDatos((a) => a.filter((p) => p.id !== id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo confirmar el cobro');
    } finally {
      setConfirmandoId(null);
    }
  }

  return (
    <PantallaAdmin
      titulo="Cobros por confirmar"
      subtitulo="Pagos que la clienta ya hizo y esperan tu validación"
      recargando={pagos.cargando && pagos.datos.length > 0}
      onRecargar={pagos.recargar}
    >
      {error ? <Aviso tono="error" icono={CircleAlert}>{error}</Aviso> : null}
      {pagos.cargando && pagos.datos.length === 0 ? (
        <Cargando />
      ) : pagos.error ? (
        <ErrorVista mensaje={pagos.error} onReintentar={pagos.recargar} />
      ) : pagos.datos.length === 0 ? (
        <Vacio titulo="No hay cobros esperando confirmación" detalle="Cuando una clienta elija pagar en efectivo, aparece acá." />
      ) : (
        pagos.datos.map((p) => (
          <TarjetaCobro key={p.id} pago={p} confirmando={confirmandoId === p.id} onConfirmar={() => confirmar(p.id)} />
        ))
      )}
    </PantallaAdmin>
  );
}
