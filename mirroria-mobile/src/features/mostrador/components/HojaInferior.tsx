import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { X } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

/** Hoja que sube desde abajo (en vez de un diálogo centrado): se maneja con el pulgar. */
export function HojaInferior({
  visible,
  titulo,
  onCerrar,
  children,
  pie,
}: {
  visible: boolean;
  titulo: string;
  onCerrar: () => void;
  children: React.ReactNode;
  pie?: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <Pressable className="flex-1 bg-black/40" onPress={onCerrar} accessibilityLabel="Cerrar" />
        <View className="max-h-[85%] rounded-t-3xl bg-background">
          <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
            <Text className="text-lg font-semibold">{titulo}</Text>
            <Pressable onPress={onCerrar} accessibilityRole="button" accessibilityLabel="Cerrar" className="h-10 w-10 items-center justify-center">
              <Icon as={X} size={22} className="text-foreground" />
            </Pressable>
          </View>
          <ScrollView contentContainerClassName="p-4 gap-3" keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {pie ? <View className="border-t border-border p-4 gap-2">{pie}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
