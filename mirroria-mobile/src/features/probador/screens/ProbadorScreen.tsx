import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { catalogApi } from '@/src/features/catalog/api/catalogApi';
import type {
  CategoriaResponseDto,
  ProductoResponseDto,
} from '@/src/features/catalog/types/catalog.types';
import { getPrimaryImageUrl } from '@/src/lib/images';
import { ProbadorHeader } from '../components/ProbadorHeader';
import { ProbadorEscena } from '../components/ProbadorEscena';
import { PermisoCamara } from '../components/PermisoCamara';
import { PrendaSelector } from '../components/PrendaSelector';
import { PrendaActual } from '../components/PrendaActual';
import { useCamaraLocal, type Lado } from '../hooks/useCamaraLocal';
import { useProbadorIA } from '../hooks/useProbadorIA';
import { esProbable, promptDePrenda } from '../lib/promptDePrenda';

export function ProbadorScreen() {
  const { productoId } = useLocalSearchParams<{ productoId?: string }>();
  const [lado, setLado] = useState<Lado>('user');
  const [intento, setIntento] = useState(0);
  const [prendas, setPrendas] = useState<ProductoResponseDto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaResponseDto[]>([]);
  const [seleccionada, setSeleccionada] = useState<ProductoResponseDto | null>(null);

  const { stream, estado: estadoCamara } = useCamaraLocal(lado, intento);
  const { remotoUrl, estado, probarPrenda } = useProbadorIA(stream);

  useEffect(() => {
    Promise.all([catalogApi.getProductos(), catalogApi.getCategorias().catch(() => [])])
      .then(([productos, cats]) => {
        setPrendas(productos.filter(esProbable));
        setCategorias(cats);
      })
      .catch((err) => console.error('[Probador] Error cargando prendas:', err));
  }, []);

  // La prenda que llega desde el catálogo (`?productoId=`) se pone sola.
  useEffect(() => {
    const pedida = prendas.find((p) => p.id === productoId);
    if (pedida) setSeleccionada(pedida);
  }, [prendas, productoId]);

  // Se (re)aplica al conectar y en cada cambio de prenda: una reconexión
  // (cambio de cámara, reintento) arranca sin prenda puesta.
  useEffect(() => {
    if (estado !== 'conectado' || !seleccionada) return;
    const url = getPrimaryImageUrl(seleccionada.imagenes);
    if (!url) return;
    const categoria = categorias.find((c) => c.id === seleccionada.categoriaId)?.nombre;
    probarPrenda(url, promptDePrenda(seleccionada, categoria));
  }, [estado, seleccionada, categorias, probarPrenda]);

  const reintentar = () => setIntento((n) => n + 1);

  return (
    <View className="flex-1 bg-background">
      <ProbadorHeader estado={estado} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 36 }}
      >
        {estadoCamara === 'sin-permiso' ? (
          <PermisoCamara onReintentar={reintentar} />
        ) : (
          <ProbadorEscena
            local={stream}
            remotoUrl={remotoUrl}
            estado={estado}
            espejo={lado === 'user'}
            onCambiarCamara={() => setLado((l) => (l === 'user' ? 'environment' : 'user'))}
            onReconectar={reintentar}
          />
        )}

        <PrendaActual prenda={seleccionada} />

        <PrendaSelector prendas={prendas} seleccionada={seleccionada} onSelect={setSeleccionada} />
      </ScrollView>
    </View>
  );
}
