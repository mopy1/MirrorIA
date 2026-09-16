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
import { Sparkles } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { RegisterForm } from '../components/RegisterForm';

export function RegisterScreen() {
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
          toValue: -Math.min(keyboardHeight * 0.48, 150),
          damping: 18,
          stiffness: 150,
          mass: 0.8,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 0.75,
          damping: 18,
          stiffness: 150,
          mass: 0.8,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 0.6,
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
              <View className="w-12 h-12 rounded-2xl bg-primary items-center justify-center mb-2.5 shadow-md">
                <Icon as={Sparkles} size={24} className="text-primary-foreground" />
              </View>
              <Text className="text-2xl font-bold tracking-tight text-foreground">
                Mirror<Text className="text-primary">IA</Text>
              </Text>
              <Text className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
                Boutique & Probador Virtual
              </Text>
            </Animated.View>

            {/* Tarjeta de Formulario */}
            <Card className="border border-border/80 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">Creá tu cuenta</CardTitle>
                <CardDescription>
                  Registrate para acceder al probador 3D, guardar tus favoritos y comprar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RegisterForm />
              </CardContent>
            </Card>
          </Animated.View>
        </ScrollView>
      </Pressable>
    </SafeAreaView>
  );
}
