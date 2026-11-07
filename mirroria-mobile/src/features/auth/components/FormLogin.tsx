import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ActivityIndicator, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTema } from '@/contexts/TemaContext';
import { useLogin } from '../hooks/use-acceso';
import { esquemaLogin, type DatosLogin } from '../types/auth.types';
import { AvisoAcceso } from './AvisoAcceso';
import { CampoTexto } from './CampoTexto';

export function FormLogin() {
  const { colores } = useTema();
  const m = useLogin();
  const { control, handleSubmit } = useForm<DatosLogin>({ resolver: zodResolver(esquemaLogin), defaultValues: { email: '', password: '' } });
  return (
    <View className="gap-4">
      <AvisoAcceso error={m.error} />
      <CampoTexto control={control} nombre="email" etiqueta="Correo" keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="tu@correo.com" />
      <CampoTexto control={control} nombre="password" etiqueta="Contraseña" secureTextEntry autoComplete="current-password" placeholder="Tu contraseña" onSubmitEditing={() => void handleSubmit((d) => m.mutate(d))()} />
      <Button size="lg" className="mt-2 h-[52px]" disabled={m.isPending} onPress={() => void handleSubmit((d) => m.mutate(d))()}>
        {m.isPending ? <ActivityIndicator color={colores['primary-foreground']} /> : null}
        <Text>{m.isPending ? 'Entrando…' : 'Entrar'}</Text>
      </Button>
    </View>
  );
}
