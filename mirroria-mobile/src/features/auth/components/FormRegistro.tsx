import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ActivityIndicator, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTema } from '@/contexts/TemaContext';
import { useRegistro } from '../hooks/use-acceso';
import { esquemaRegistro, type DatosRegistro } from '../types/auth.types';
import { AvisoAcceso } from './AvisoAcceso';
import { CampoTexto } from './CampoTexto';

export function FormRegistro() {
  const { colores } = useTema();
  const m = useRegistro();
  const { control, handleSubmit, setFocus } = useForm<DatosRegistro>({
    resolver: zodResolver(esquemaRegistro),
    defaultValues: { fullName: '', email: '', password: '' },
  });
  return (
    <View className="gap-4">
      <AvisoAcceso error={m.error} />
      <CampoTexto control={control} nombre="fullName" etiqueta="Nombre" autoComplete="name" placeholder="Cómo te llamás" returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => setFocus('email')} />
      <CampoTexto control={control} nombre="email" etiqueta="Correo" keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="tu@correo.com" returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => setFocus('password')} />
      <CampoTexto control={control} nombre="password" etiqueta="Contraseña" secureTextEntry autoComplete="new-password" placeholder="Mínimo 8 caracteres" returnKeyType="go" onSubmitEditing={() => void handleSubmit((d) => m.mutate(d))()} />
      <Button size="lg" className="mt-2 h-[52px]" disabled={m.isPending} onPress={() => void handleSubmit((d) => m.mutate(d))()}>
        {m.isPending ? <ActivityIndicator color={colores['primary-foreground']} /> : null}
        <Text>{m.isPending ? 'Creando…' : 'Crear cuenta'}</Text>
      </Button>
    </View>
  );
}
