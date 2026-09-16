import React from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Buscar prendas, vestidos, blusas...',
  onClear,
}: SearchInputProps) {
  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View className="flex-row items-center bg-card border border-border/80 rounded-xl px-3.5 h-11 shadow-sm">
      <Icon as={Search} size={18} className="text-muted-foreground mr-2.5" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        className="flex-1 text-sm text-foreground py-0"
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Pressable
          onPress={handleClear}
          hitSlop={8}
          className="w-6 h-6 rounded-full bg-muted items-center justify-center ml-2"
        >
          <Icon as={X} size={13} className="text-muted-foreground" />
        </Pressable>
      )}
    </View>
  );
}
