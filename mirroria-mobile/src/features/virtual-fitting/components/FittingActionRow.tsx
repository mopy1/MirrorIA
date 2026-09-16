import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ticket, Heart } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';

const SIZES = ['XS', 'S', 'M', 'L', 'XL'];

export function FittingActionRow() {
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState('M');
  const [isSaved, setIsSaved] = useState(false);

  return (
    <View className="gap-3.5">
      {/* Tallas disponibles */}
      <View className="flex-row items-center justify-between px-1">
        <Text className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Seleccionar Talla
        </Text>
        <Text className="text-xs text-primary font-semibold">Guía de Tallas</Text>
      </View>

      <View className="flex-row items-center gap-2">
        {SIZES.map((size) => {
          const isSelected = selectedSize === size;
          return (
            <Pressable
              key={size}
              onPress={() => setSelectedSize(size)}
              className={`flex-1 py-2 rounded-xl border items-center justify-center ${
                isSelected
                  ? 'bg-primary border-primary'
                  : 'bg-card border-border/70'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  isSelected ? 'text-primary-foreground' : 'text-foreground'
                }`}
              >
                {size}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Botones de acción */}
      <View className="flex-row items-center gap-2.5 pt-1">
        <Button
          size="lg"
          onPress={() => router.push('/(tabs)/perfil')}
          className="flex-1 flex-row items-center justify-center gap-2"
        >
          <Icon as={Ticket} size={18} className="text-primary-foreground" />
          <Text className="text-xs font-bold text-primary-foreground">
            Reservar Cita en Tienda
          </Text>
        </Button>

        <Button
          size="icon"
          variant="outline"
          onPress={() => setIsSaved(!isSaved)}
          className={`w-12 h-12 rounded-xl border-border/70 ${
            isSaved ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/30' : ''
          }`}
        >
          <Icon
            as={Heart}
            size={20}
            className={isSaved ? 'text-rose-500 fill-rose-500' : 'text-muted-foreground'}
          />
        </Button>
      </View>
    </View>
  );
}
