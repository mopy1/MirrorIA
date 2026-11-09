import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { Cargando, ErrorVista } from '@/components/admin/Estados';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { tiendaActual } from '@/src/lib/tienda';
import { saasApi } from '../api/saasApi';
import { Aviso } from '../components/Aviso';
import { Campo } from '../components/Campo';
import { TiendaFila } from '../components/TiendaFila';
import { TiendaNoDisponible } from '../components/TiendaNoDisponible';
import { useCambiarTienda, type DestinoTienda } from '../hooks/useCambiarTienda';
import { useRecurso } from '../hooks/useRecurso';
import { slugDesdeEntrada } from '../lib/slug';

/**
 * `/saas/tiendas`: elegir o cambiar de tienda (directorio + entrar por dirección).
 * Con `?para=equipo` (desde "Soy del equipo"), después de elegir va al login.
 */
export function TiendasScreen() {
  const router = useRouter();
  const { para } = useLocalSearchParams<{ para?: string }>();
  const destino: DestinoTienda = para === 'equipo' ? 'login' : 'tienda';
  const directorio = useRecurso(() => saasApi.getTiendas(24), true, 'No se pudo cargar el directorio de tiendas');
  const c = useCambiarTienda();
  const [direccion, setDireccion] = useState('');
  const actual = tiendaActual();
  // La tienda demo primero, como en la web.
  const tiendas = [...(directorio.data ?? [])].sort((a, b) => Number(b.slug === 'tiendaria') - Number(a.slug === 'tiendaria'));

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <ScreenHeader
        title={destino === 'login' ? 'Entrar a mi tienda' : 'Cambiar de tienda'}
        subtitle="Cada tienda tiene sus propias cuentas"
        showLogo={false}
        showBack
      />
      <ScrollView contentContainerClassName="p-4 gap-4 pb-10" keyboardShouldPersistTaps="handled">
        {c.noDisponible ? (
          <TiendaNoDisponible
            nombre={c.noDisponible.nombre}
            onOtrasTiendas={c.cerrarNoDisponible}
            onSoyDuena={() => c.irA('login')}
          />
        ) : (
          <>
            <View className="gap-3 rounded-2xl border border-border bg-card p-4">
              <Campo
                label="Dirección de la tienda"
                prefijo="/t/"
                value={direccion}
                onChangeText={(v) => {
                  setDireccion(v);
                  c.setError(null);
                }}
                placeholder="casa-andina"
                autoCapitalize="none"
                autoCorrect={false}
                ayuda="Está en el link que te compartió la tienda."
                onSubmitEditing={() => c.entrar(slugDesdeEntrada(direccion), destino)}
              />
              <Button onPress={() => c.entrar(slugDesdeEntrada(direccion), destino)} disabled={!direccion.trim() || !!c.entrando}>
                <Text>{c.entrando ? 'Abriendo…' : 'Continuar'}</Text>
              </Button>
            </View>
            {c.error && <Aviso tono="error" texto={c.error} />}

            <Text className="text-sm font-semibold text-foreground">Tiendas creadas con MirrorIA</Text>
            {directorio.isLoading && <Cargando texto="Buscando tiendas…" />}
            {directorio.error && <ErrorVista mensaje={directorio.error} onReintentar={directorio.reload} />}
            {tiendas.map((t) => (
              <TiendaFila key={t.id} tienda={t} actual={t.slug === actual} entrando={c.entrando === t.slug} onPress={() => c.entrar(t.slug, destino)} />
            ))}

            <View className="gap-2 rounded-2xl bg-muted/50 p-4">
              <Text className="text-sm font-semibold text-foreground">¿Todavía no tenés tienda?</Text>
              <Text className="text-xs text-muted-foreground">Creala en 5 minutos, con días de prueba gratis.</Text>
              <View className="flex-row gap-2 pt-1">
                <Button className="flex-1" onPress={() => router.push('/saas/registro')}>
                  <Text>Crear mi tienda</Text>
                </Button>
                <Button variant="outline" className="flex-1" onPress={() => router.push('/saas/planes')}>
                  <Text>Ver planes</Text>
                </Button>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
