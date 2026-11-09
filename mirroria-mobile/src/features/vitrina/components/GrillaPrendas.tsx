import { View } from 'react-native';
import type { PrendaVitrina } from '@/lib/db/tipos-espejo';
import { TarjetaPrenda } from './TarjetaPrenda';

/** Dos columnas desfasadas (editorial): la izquierda arranca alta y la derecha baja, y alternan. */
export function GrillaPrendas({ prendas }: { prendas: PrendaVitrina[] }) {
  const izq = prendas.filter((_, i) => i % 2 === 0);
  const der = prendas.filter((_, i) => i % 2 === 1);
  return (
    <View className="flex-row gap-3 px-5">
      <View className="flex-1">
        {izq.map((p, i) => (
          <TarjetaPrenda key={p.id} prenda={p} proporcion={i % 2 === 0 ? 0.66 : 0.8} />
        ))}
      </View>
      <View className="flex-1">
        {der.map((p, i) => (
          <TarjetaPrenda key={p.id} prenda={p} proporcion={i % 2 === 0 ? 0.8 : 0.66} />
        ))}
      </View>
    </View>
  );
}
