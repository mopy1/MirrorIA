import React from 'react';
import { View } from 'react-native';
import { QrCode, Store, Calendar, CheckCircle2 } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';

export function StorePassCard() {
  return (
    <View className="rounded-3xl bg-card border border-border/80 p-5 shadow-sm gap-4 relative overflow-hidden">
      {/* Barra de acento lateral */}
      <View className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Icon as={Store} size={18} className="text-primary" />
          <Text className="text-sm font-bold text-foreground">
            Pase de Tienda Activo
          </Text>
        </View>

        <Badge variant="success" className="px-2 py-0.5 flex-row items-center gap-1">
          <Icon as={CheckCircle2} size={11} className="text-emerald-600" />
          <Text className="text-[10px] font-bold text-emerald-600">
            Confirmado
          </Text>
        </Badge>
      </View>

      {/* Contenido del Pase */}
      <View className="flex-row items-center gap-4 bg-muted/30 p-3.5 rounded-2xl">
        <View className="w-16 h-16 rounded-xl bg-background border border-border items-center justify-center shadow-xs">
          <Icon as={QrCode} size={36} className="text-foreground" />
        </View>

        <View className="flex-1 gap-1">
          <Text className="text-xs font-bold text-foreground">
            Sucursal Equipetrol
          </Text>
          <View className="flex-row items-center gap-1">
            <Icon as={Calendar} size={12} className="text-muted-foreground" />
            <Text className="text-[11px] text-muted-foreground">
              Hoy, 16:30 hrs • Probador #2
            </Text>
          </View>
          <Text className="text-[10px] text-primary font-semibold">
            Código: MIA-8492
          </Text>
        </View>
      </View>

      <Text className="text-[10px] text-muted-foreground text-center">
        Presentá este código en el mostrador para ingresar directo a tu probador sin hacer fila.
      </Text>
    </View>
  );
}
