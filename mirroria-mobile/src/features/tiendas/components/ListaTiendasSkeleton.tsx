import { View } from 'react-native';
import { Skeleton } from '@/components/ui/skeleton';

/** 4 tarjetas con la forma real (portada + logo + dos líneas). */
export function ListaTiendasSkeleton() {
  return (
    <View className="gap-4">
      {[0, 1, 2, 3].map((i) => (
        <View key={i} className="overflow-hidden rounded-2xl border border-border">
          <Skeleton className="h-36 rounded-none" />
          <View className="flex-row items-center gap-3 p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <View className="flex-1 gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
