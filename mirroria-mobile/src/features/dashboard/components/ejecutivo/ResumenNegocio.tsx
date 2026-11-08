import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { AlertCircle, ArrowRight, CheckCircle2, Info } from 'lucide-react-native';
import { Seccion } from '@/components/admin/Seccion';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { armarAvisosNegocio, armarResumenNegocio, type AvisoNegocio } from '../../lib/resumen-negocio';
import type { DashboardEjecutivoDto } from '../../types/dashboard.types';

const TONOS = {
  info: { icon: Info, color: 'text-sky-600' },
  atencion: { icon: AlertCircle, color: 'text-amber-600' },
  bien: { icon: CheckCircle2, color: 'text-emerald-600' },
} as const;

function Aviso({ aviso }: { aviso: AvisoNegocio }) {
  const router = useRouter();
  const t = TONOS[aviso.tono];
  return (
    <View className="flex-row gap-2.5 border-t border-border/70 pt-3">
      <Icon as={t.icon} size={18} className={t.color} />
      <View className="flex-1 gap-1.5">
        <Text className="text-sm leading-5">{aviso.texto}</Text>
        {aviso.href ? (
          <Pressable
            onPress={() => router.push(aviso.href as Href)}
            hitSlop={8}
            className="flex-row items-center gap-1 self-start py-1">
            <Text className="text-sm font-semibold text-primary">{aviso.accion}</Text>
            <Icon as={ArrowRight} size={14} className="text-primary" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/** "En pocas palabras": la conclusión del período + "qué mirar" con acceso directo. */
export function ResumenNegocio({ data }: { data: DashboardEjecutivoDto }) {
  const resumen = useMemo(() => armarResumenNegocio(data), [data]);
  const avisos = useMemo(() => armarAvisosNegocio(data), [data]);
  return (
    <Seccion titulo="En pocas palabras">
      <Text className="text-[15px] leading-6">{resumen}</Text>
      {avisos.map((a) => (
        <Aviso key={a.id} aviso={a} />
      ))}
    </Seccion>
  );
}
