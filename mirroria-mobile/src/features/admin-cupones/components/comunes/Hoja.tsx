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
  /** Botones fijos al pie (guardar / cancelar). */
  pie?: React.ReactNode;
  children: React.ReactNode;
}

/** Hoja inferior para formularios del panel: se desliza desde abajo y se cierra tocando afuera. */
export function Hoja({ visible, titulo, descripcion, onCerrar, pie, children }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/40" onPress={onCerrar} accessibilityLabel="Cerrar" />
        <View className="max-h-[92%] rounded-t-3xl bg-background border-t border-border">
          <View className="items-center pt-2">
            <View className="h-1.5 w-12 rounded-full bg-muted" />
          </View>
          <View className="flex-row items-start gap-3 px-5 pt-3 pb-2">
            <View className="flex-1 gap-1">
              <Text className="text-lg font-semibold">{titulo}</Text>
              {descripcion ? <Text className="text-sm text-muted-foreground">{descripcion}</Text> : null}
            </View>
            <Pressable onPress={onCerrar} hitSlop={12} accessibilityLabel="Cerrar" className="p-1">
              <Icon as={X} size={22} className="text-muted-foreground" />
            </Pressable>
          </View>
          <ScrollView contentContainerClassName="px-5 pb-4 gap-4" keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {pie ? <View className="flex-row gap-3 border-t border-border px-5 py-4">{pie}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
