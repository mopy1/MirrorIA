import React from 'react';
import { View } from 'react-native';
import { SearchX, RotateCcw } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';

interface CatalogEmptyStateProps {
  message?: string;
  onReset?: () => void;
}

export function CatalogEmptyState({
  message = 'No encontramos prendas que coincidan con tu búsqueda.',
  onReset,
}: CatalogEmptyStateProps) {
  return (
    <View className="items-center justify-center py-16 px-6 gap-3">
      <View className="w-14 h-14 rounded-2xl bg-muted items-center justify-center">
        <Icon as={SearchX} size={28} className="text-muted-foreground" />
      </View>
      <Text className="text-base font-semibold text-foreground text-center">
        Sin resultados
      </Text>
      <Text className="text-xs text-muted-foreground text-center max-w-[240px]">
        {message}
      </Text>
      {onReset && (
        <Button
          variant="outline"
          size="sm"
          onPress={onReset}
          className="mt-2 flex-row items-center gap-1.5"
        >
          <Icon as={RotateCcw} size={14} />
          <Text className="text-xs">Restablecer filtros</Text>
        </Button>
      )}
    </View>
  );
}
