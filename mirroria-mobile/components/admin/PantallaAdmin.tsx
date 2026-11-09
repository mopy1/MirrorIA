import React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/common/ScreenHeader';

interface Props {
  titulo: string;
  subtitulo?: string;
  accion?: React.ReactNode;
  /** false cuando la pantalla trae su propia lista con scroll (FlatList). */
  scroll?: boolean;
  /** false en la portada del panel (no hay a dónde volver). */
  volver?: boolean;
  recargando?: boolean;
  onRecargar?: () => void;
  children: React.ReactNode;
}

/** Marco común de toda pantalla del panel: encabezado con volver, título y contenido. */
export function PantallaAdmin({
  titulo,
  subtitulo,
  accion,
  scroll = true,
  volver = true,
  recargando,
  onRecargar,
  children,
}: Props) {
  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <ScreenHeader title={titulo} subtitle={subtitulo} showLogo={false} showBack={volver} rightAction={accion} />
      {scroll ? (
        <ScrollView
          contentContainerClassName="p-4 gap-4 pb-10"
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRecargar ? <RefreshControl refreshing={!!recargando} onRefresh={onRecargar} /> : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View className="flex-1">{children}</View>
      )}
    </SafeAreaView>
  );
}
