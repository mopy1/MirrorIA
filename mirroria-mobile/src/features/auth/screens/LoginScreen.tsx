import React, { useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Keyboard,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandLogo } from '@/components/brand-logo';
import { useMarcaTienda } from '@/src/features/saas/hooks/useMarcaTienda';
import { AccesosPlataforma } from '../components/AccesosPlataforma';
import { AuthBackButton } from '@/components/common/AuthBackButton';
import { LoginForm } from '../components/LoginForm';

export function LoginScreen() {
  const { marca } = useMarcaTienda();
  const translateY = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const keyboardHeight = e.endCoordinates?.height || 280;
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: -Math.min(keyboardHeight * 0.44, 135),
          damping: 18,
          stiffness: 150,
          mass: 0.8,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 0.8,
          damping: 18,
          stiffness: 150,
          mass: 0.8,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 0.65,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 20,
          stiffness: 160,
          mass: 0.8,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          damping: 20,
          stiffness: 160,
          mass: 0.8,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [translateY, logoScale, logoOpacity]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <AuthBackButton />
      <Pressable
        className="flex-1"
        onPress={Keyboard.dismiss}
        accessible={false}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingVertical: 24,
          }}
          className="px-6"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              transform: [{ translateY }],
            }}
          >
            {/* Logo & Marca con micro-animación fluida */}
            <Animated.View
              style={{
                transform: [{ scale: logoScale }],
                opacity: logoOpacity,
              }}
              className="items-center mb-6"
            >
              <View style={{ alignItems: 'center' }}>
                <BrandLogo size="xl" withText={false} className="mb-2.5" />
                <Text className="text-2xl font-bold tracking-tight text-foreground text-center">
                  {marca?.nombre ?? 'MirrorIA'}
                </Text>
                <Text className="text-xs uppercase tracking-widest text-muted-foreground mt-1 text-center">
                  Boutique & Probador Virtual
                </Text>
              </View>
            </Animated.View>

            {/* Tarjeta de Formulario */}
            <Card className="border border-border/80 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">Iniciar sesión</CardTitle>
                <CardDescription>
                  Ingresá tus credenciales para acceder a tu armario y probarte prendas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LoginForm />
              </CardContent>
            </Card>
            <AccesosPlataforma />
          </Animated.View>
        </ScrollView>
      </Pressable>
    </SafeAreaView>
  );
}
