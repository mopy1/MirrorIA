import { Text as RNText, View } from 'react-native';
import { useTema } from '@/contexts/TemaContext';
import { FAMILIA_PLATAFORMA } from '@/lib/tema/fuentes';

/**
 * Wordmark `mırrorIA`: "ı" sin punto y el punto en lima (como la web). El lima es
 * siempre relleno, nunca texto sobre claro.
 */
export function PlataformaLogo({ tamano = 28 }: { tamano?: number }) {
  const { colores } = useTema();
  const estilo = { fontFamily: FAMILIA_PLATAFORMA, fontSize: tamano, letterSpacing: -0.8, color: colores.foreground, lineHeight: tamano * 1.15 };
  const punto = tamano * 0.2;
  return (
    <View className="flex-row items-end" accessibilityRole="header" accessibilityLabel="MirrorIA">
      <RNText style={estilo}>m</RNText>
      <View>
        <View
          style={{ position: 'absolute', top: tamano * 0.1, left: tamano * 0.06, width: punto, height: punto, borderRadius: punto / 2, backgroundColor: '#C3F74C' }}
        />
        <RNText style={estilo}>ı</RNText>
      </View>
      <RNText style={estilo}>rror</RNText>
      <RNText style={{ ...estilo, color: colores.primary }}>IA</RNText>
    </View>
  );
}
