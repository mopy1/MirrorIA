import React from 'react';
import { Pressable, View } from 'react-native';
import { Lock } from 'lucide-react-native';
import { Cargando, ErrorVista } from '@/components/admin/Estados';
import { Seccion } from '@/components/admin/Seccion';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

interface Props {
  titulo: string;
  frase?: string;
  /** Texto del enlace de la esquina ("Ver todas", "Ir a Inventario"). */
  enlace?: { texto: string; onPress: () => void };
  isLoading: boolean;
  error: string | null;
  hayDatos: boolean;
  /** Nombre de lo que falló, para "No pudimos cargar ...". */
  que: string;
  onReintentar: () => void;
  /** Modelo que el rol no puede pedir (solo la dueña). */
  soloDuena?: boolean;
  vacio?: { titulo: string; detalle: string } | null;
  children: React.ReactNode;
}

/** Bloque de una predicción: conclusión en una frase + carga / error / vacío / contenido. */
export function BloqueMl(p: Props) {
  const accion = p.enlace ? (
    <Pressable onPress={p.enlace.onPress} hitSlop={8}>
      <Text className="text-sm font-semibold text-primary">{p.enlace.texto}</Text>
    </Pressable>
  ) : undefined;

  let cuerpo: React.ReactNode;
  if (p.soloDuena) {
    cuerpo = (
      <View className="flex-row items-start gap-2.5 rounded-xl bg-muted/60 p-3">
        <Icon as={Lock} size={16} className="mt-0.5 text-muted-foreground" />
        <Text className="flex-1 text-sm text-muted-foreground">
          Esta parte la ve solo la dueña de la tienda: tiene datos de todas las clientas y de la caja.
        </Text>
      </View>
    );
  } else if (p.isLoading && !p.hayDatos) cuerpo = <Cargando />;
  else if (p.error && !p.hayDatos)
    cuerpo = <ErrorVista mensaje={`No pudimos cargar ${p.que}. Revisá tu conexión e intentá de nuevo.`} onReintentar={p.onReintentar} />;
  else if (p.vacio)
    cuerpo = (
      <View className="items-center gap-1.5 rounded-xl bg-muted/40 px-4 py-6">
        <Text className="text-center text-sm font-medium">{p.vacio.titulo}</Text>
        <Text className="text-center text-sm text-muted-foreground">{p.vacio.detalle}</Text>
      </View>
    );
  else cuerpo = p.children;

  return (
    <Seccion titulo={p.titulo} accion={p.soloDuena ? undefined : accion}>
      {p.frase && !p.soloDuena ? <Text className="text-sm leading-5 text-muted-foreground">{p.frase}</Text> : null}
      {cuerpo}
    </Seccion>
  );
}
