import { MagnifyingGlass } from 'phosphor-react-native';
import * as React from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';

/** Si la etiqueta está dañada o no hay buena luz: el código impreso debajo del QR (p. ej. VFL-M-ROJ). */
export function CodigoManual({ onBuscar }: { onBuscar: (codigo: string) => void }) {
  const [codigo, setCodigo] = React.useState('');
  const buscar = () => codigo.trim() && onBuscar(codigo);
  return (
    <View className="gap-2 px-5">
      <Text className="font-body-medium text-sm">Código de la etiqueta</Text>
      <View className="flex-row gap-2">
        <Input
          value={codigo}
          onChangeText={setCodigo}
          placeholder="VFL-M-ROJ"
          autoCapitalize="characters"
          autoCorrect={false}
          autoFocus
          returnKeyType="search"
          onSubmitEditing={buscar}
          className="h-12 flex-1 font-mono"
        />
        <Button className="h-12" disabled={!codigo.trim()} onPress={buscar} accessibilityLabel="Buscar prenda">
          <Icon as={MagnifyingGlass} size={18} weight="bold" className="text-primary-foreground" />
          <Text>Buscar</Text>
        </Button>
      </View>
    </View>
  );
}
