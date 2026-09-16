import React from 'react';
import { View, Pressable } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'expo-router';
import { AlertCircle } from 'lucide-react-native';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useRegister } from '../hooks/useRegister';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Ingresá tu nombre completo'),
  email: z.string().min(1, 'Ingresá tu email').email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const { submit, isLoading, error } = useRegister();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  });

  return (
    <View className="flex flex-col gap-4 w-full">
      {error && (
        <View className="flex flex-row items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3.5">
          <Icon as={AlertCircle} size={18} className="text-destructive shrink-0" />
          <Text className="text-sm font-medium text-destructive flex-1">{error}</Text>
        </View>
      )}

      {/* Campo Nombre Completo */}
      <View className="flex flex-col gap-1">
        <Label>Nombre completo</Label>
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="María Pérez"
              autoCapitalize="words"
              className={errors.fullName ? 'border-destructive' : ''}
            />
          )}
        />
        {errors.fullName && (
          <Text className="text-xs text-destructive mt-1">{errors.fullName.message}</Text>
        )}
      </View>

      {/* Campo Email */}
      <View className="flex flex-col gap-1">
        <Label>Email</Label>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="tu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              className={errors.email ? 'border-destructive' : ''}
            />
          )}
        />
        {errors.email && (
          <Text className="text-xs text-destructive mt-1">{errors.email.message}</Text>
        )}
      </View>

      {/* Campo Contraseña */}
      <View className="flex flex-col gap-1">
        <Label>Contraseña</Label>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Mínimo 8 caracteres"
              secureTextEntry
              autoCapitalize="none"
              className={errors.password ? 'border-destructive' : ''}
            />
          )}
        />
        {errors.password && (
          <Text className="text-xs text-destructive mt-1">{errors.password.message}</Text>
        )}
      </View>

      {/* Botón de Enviar */}
      <Button
        size="lg"
        disabled={isLoading}
        onPress={handleSubmit(submit)}
        className="w-full mt-2"
      >
        <Text className="text-base font-semibold text-primary-foreground">
          {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
        </Text>
      </Button>

      {/* Switch to Login */}
      <View className="flex flex-row justify-center items-center gap-1.5 mt-2">
        <Text className="text-sm text-muted-foreground">¿Ya tenés cuenta?</Text>
        <Pressable onPress={() => router.push('/(auth)/login')}>
          <Text className="text-sm font-semibold text-primary underline">Iniciá sesión</Text>
        </Pressable>
      </View>
    </View>
  );
}
