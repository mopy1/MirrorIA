import React, { useState } from 'react';
import { Platform, Pressable, View, type TextInput } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { Input } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, 'secureTextEntry'> &
  React.RefAttributes<TextInput>;

/** Campo de contraseña con botón para mostrarla y revisar que esté bien escrita. */
export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View className="relative justify-center">
      <Input
        {...props}
        secureTextEntry={!visible}
        // Visible, el teclado de Android sugeriría (y aprendería) la contraseña:
        // 'visible-password' lo evita. iOS no tiene ese tipo.
        keyboardType={visible && Platform.OS === 'android' ? 'visible-password' : 'default'}
        autoCapitalize="none"
        autoCorrect={false}
        className={cn('pr-12', className)}
      />
      <Pressable
        onPress={() => setVisible((v) => !v)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute right-1 h-9 w-10 items-center justify-center rounded-md active:bg-muted"
      >
        <Icon as={visible ? EyeOff : Eye} size={18} className="text-muted-foreground" />
      </Pressable>
    </View>
  );
}
