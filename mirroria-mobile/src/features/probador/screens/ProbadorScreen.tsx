import { StatusBar } from 'expo-status-bar';
import { useIsFocused } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarraRed } from '@/components/common/BarraRed';
import { Text } from '@/components/ui/text';
import { ChipEstadoProbador } from '../components/ChipEstadoProbador';
import { PanelEstadoProbador } from '../components/PanelEstadoProbador';
import { PieProbador } from '../components/PieProbador';
import { TiraPrendas } from '../components/TiraPrendas';
import { VideoProbador } from '../components/VideoProbador';
import { useProbador } from '../hooks/use-probador';

/** Tab Probador (M4.4): Decart `lucy-vton-3.5` en vivo con la cámara frontal y las prendas de la vitrina. */
export default function ProbadorScreen() {
  const p = useProbador();
  const enfocada = useIsFocused();
  const prendas = p.prendas.data ?? [];
  const conVideo = p.fase === 'en-vivo' || p.fase === 'conectando' || p.fase === 'abriendo-camara';
  return (
    <View className="flex-1 bg-black">
      {enfocada ? <StatusBar style="light" /> : null}
      {conVideo ? <VideoProbador local={p.camara.stream} remoto={p.sesion.remoto} conectando={p.fase !== 'en-vivo'} /> : null}
      <SafeAreaView edges={['top']} className="flex-1">
        <View className="bg-background">
          <BarraRed />
        </View>
        <View className="px-5 pt-3">
          <ChipEstadoProbador fase={p.fase} restante={p.restante} />
        </View>
        <View className="flex-1">
          {conVideo ? null : (
            <PanelEstadoProbador
              fase={p.fase}
              error={p.sesion.error}
              hayPrendas={prendas.length > 0}
              onEncender={p.encender}
              onPermiso={() => void p.camara.pedirPermiso()}
              onReintentar={p.reintentar}
            />
          )}
        </View>
        <View className="gap-3 bg-black/55 pb-4 pt-3">
          {p.fase === 'en-vivo' && p.sesion.error ? <Text className="px-5 text-xs text-white/85">{p.sesion.error}</Text> : null}
          {prendas.length > 0 ? <TiraPrendas prendas={prendas} elegidaId={p.elegida?.id ?? null} onElegir={p.elegir} /> : null}
          {p.fase === 'en-vivo' ? <PieProbador prenda={p.elegida} onTerminar={() => p.apagar()} /> : null}
        </View>
      </SafeAreaView>
    </View>
  );
}
