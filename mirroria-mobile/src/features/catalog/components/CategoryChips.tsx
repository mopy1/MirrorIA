import React from 'react';
import { ScrollView, Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import type { CategoriaResponseDto } from '../types/catalog.types';

interface CategoryChipsProps {
  categories: CategoriaResponseDto[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
}

export function CategoryChips({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategoryChipsProps) {
  const isAllSelected = selectedCategoryId === null;

  return (
    <View className="py-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        <Pressable
          onPress={() => onSelectCategory(null)}
          className={`px-4 py-2 rounded-full border ${
            isAllSelected
              ? 'bg-primary border-primary'
              : 'bg-card border-border/70'
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              isAllSelected ? 'text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            Todas
          </Text>
        </Pressable>

        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <Pressable
              key={cat.id}
              onPress={() => onSelectCategory(cat.id)}
              className={`px-4 py-2 rounded-full border ${
                isSelected
                  ? 'bg-primary border-primary'
                  : 'bg-card border-border/70'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  isSelected
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {cat.nombre}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
