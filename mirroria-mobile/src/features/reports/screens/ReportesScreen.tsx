import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Vacio } from '@/components/admin/Estados';
import { PantallaAdmin } from '@/components/admin/PantallaAdmin';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { useAuth } from '@/src/hooks/useAuth';
import { ChatReportes } from '../components/ChatReportes';
import { ConstructorReporte } from '../components/ConstructorReporte';
import { TarjetaReporte } from '../components/TarjetaReporte';
import { exportarReporte } from '../hooks/useExportar';
import { useReportes } from '../hooks/useReportes';

type Vista = 'preguntar' | 'armar' | 'reportes';
const ROLES = ['ADMIN', 'ENCARGADO_SUCURSAL'];

/** Reportes con IA (ADMIN y encargada): pedir en lenguaje natural o armar sin IA, ver la tabla y exportar. */
export function ReportesScreen() {
  const { user } = useAuth();
  if (!user || !ROLES.includes(user.role)) {
    return (
      <PantallaAdmin titulo="Reportes con IA">
        <Vacio titulo="Esta pantalla es para la dueña y la encargada" detalle="Pedile a la dueña de la tienda el reporte que necesites." />
      </PantallaAdmin>
    );
  }
  return <Reportes elegirSucursal={user.role === 'ADMIN'} />;
}

function Reportes({ elegirSucursal }: { elegirSucursal: boolean }) {
  const [vista, setVista] = useState<Vista>('preguntar');
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const r = useReportes((abierto, formato) => {
    exportarReporte(abierto.reporte, abierto.titulo, formato).catch(() =>
      setErrorArchivo('El reporte está listo, pero no pude generar el archivo. Probá con los botones de Excel o PDF.')
    );
  });

  const pestanas: { id: Vista; label: string }[] = [
    { id: 'preguntar', label: 'Preguntar' },
    { id: 'armar', label: 'Armar sin IA' },
    { id: 'reportes', label: `Reportes${r.abiertos.length ? ` (${r.abiertos.length})` : ''}` },
  ];

  function verReporte(id: string) {
    r.setActivoId(id);
    setVista('reportes');
  }

  return (
    <PantallaAdmin titulo="Reportes con IA" subtitulo={elegirSucursal ? 'Toda la tienda' : 'Tu sucursal'}>
      <View className="flex-row rounded-xl bg-muted p-1" accessibilityRole="tablist">
        {pestanas.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => setVista(p.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: vista === p.id }}
            className={cn('min-h-10 flex-1 items-center justify-center rounded-lg px-1', vista === p.id && 'bg-background shadow-sm')}
          >
            <Text className={cn('text-sm', vista === p.id ? 'font-semibold' : 'text-muted-foreground')}>{p.label}</Text>
          </Pressable>
        ))}
      </View>

      {errorArchivo ? <Text className="text-sm text-destructive">{errorArchivo}</Text> : null}

      {vista === 'preguntar' ? (
        <ChatReportes mensajes={r.mensajes} pensando={r.pensando} onPreguntar={r.preguntar} onVerReporte={verReporte} />
      ) : null}

      {vista === 'armar' ? (
        <ConstructorReporte
          elegirSucursal={elegirSucursal}
          onGenerado={(reporte, titulo) => {
            r.abrir(reporte, titulo);
            setVista('reportes');
          }}
        />
      ) : null}

      {vista === 'reportes' ? (
        r.activo ? (
          <View className="gap-3">
            {r.abiertos.length > 1 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
                {r.abiertos.map((a) => (
                  <Pressable
                    key={a.id}
                    onPress={() => r.setActivoId(a.id)}
                    className={cn('max-w-56 rounded-full border px-3 py-2', a.id === r.activo?.id ? 'border-primary bg-primary/10' : 'border-border')}
                  >
                    <Text numberOfLines={1} className="text-xs">{a.titulo}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}
            <TarjetaReporte
              key={r.activo.id}
              abierto={r.activo}
              onCerrar={() => r.cerrar(r.activo!.id)}
              onReemplazar={(nuevo) => r.reemplazar(r.activo!.id, nuevo)}
            />
          </View>
        ) : (
          <Vacio titulo="Todavía no armaste ningún reporte" detalle="Preguntale a la IA o usá «Armar sin IA»: el reporte aparece acá con su tabla y para exportar." />
        )
      ) : null}
    </PantallaAdmin>
  );
}
