import { useWindowDimensions, View } from 'react-native';
import { Skeleton } from '@/components/ui/skeleton';

export function FichaSkeleton() {
  const { width } = useWindowDimensions();
  return (
    <View>
      <Skeleton className="rounded-none" style={{ width, height: width * 1.25 }} />
      <View className="gap-3 p-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <View className="mt-4 flex-row gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-14" />
          ))}
        </View>
      </View>
    </View>
  );
}
