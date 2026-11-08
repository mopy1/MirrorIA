import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { X } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

interface Props {
  visible: boolean;
  titulo: string;
  descripcion?: string;
  onCerrar: () => void;
  /** Botones fijos al pie (Cancelar / Confirmar). */
  pie?: React.ReactNode;
  children: React.ReactNode;
}

/** Hoja que sube desde abajo (en vez de un diálogo centrado): se maneja con el pulgar. */
export function HojaInferior({ visible, titulo, descripcion, onCerrar, pie, children }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/40" onPress={onCerrar} accessibilityLabel="Cerrar" />
        <View className="max-h-[88%] rounded-t-3xl bg-background pb-6">
          <View className="items-center pt-2.5">
            <View className="h-1.5 w-10 rounded-full bg-muted" />
          </View>
          <View className="flex-row items-start justify-between gap-3 px-5 pt-3 pb-2">
            <View className="flex-1 gap-0.5">
              <Text className="text-lg font-semibold text-foreground">{titulo}</Text>
              {descripcion ? <Text className="text-sm text-muted-foreground">{descripcion}</Text> : null}
            </View>
            <Pressable onPress={onCerrar} hitSlop={10} className="h-8 w-8 items-center justify-center rounded-full active:bg-muted">
              <Icon as={X} size={18} className="text-muted-foreground" />
            </Pressable>
          </View>
          <ScrollView contentContainerClassName="px-5 pb-3 gap-3" keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {pie ? <View className="flex-row gap-2.5 px-5 pt-2">{pie}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
