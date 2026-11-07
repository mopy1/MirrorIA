import { View } from 'react-native';
import { Skeleton } from '@/components/ui/skeleton';

/** Forma real de la vitrina: chips + dos columnas desfasadas. */
export function VitrinaSkeleton() {
  return (
    <View>
      <View className="flex-row gap-2 px-5 py-4">
        {[56, 80, 72].map((w) => (
          <Skeleton key={w} className="h-10 rounded-full" style={{ width: w }} />
        ))}
      </View>
      <View className="flex-row gap-3 px-5">
        {[0.66, 0.8].map((r) => (
          <View key={r} className="flex-1 gap-2">
            <Skeleton className="rounded-lg" style={{ aspectRatio: r }} />
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </View>
        ))}
      </View>
    </View>
  );
}
