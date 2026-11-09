import React from 'react';
import { Pressable, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { Aviso } from '../../saas/components/Aviso';
import { Campo } from '../../saas/components/Campo';
import type { FuenteMarca, RadioMarca } from '../../saas/types/saas.types';
import { ajustarContraste, normalizarHex } from '../lib/color';
import { errorContraste } from '../lib/marca-borrador';
import { CODIGOS_PALETA, FUENTES, PALETAS, RADIOS } from '../lib/marca.constants';
import type { EditorMarca } from '../hooks/useEditorMarca';
import { Candado, FilaSwitch, Opciones } from './Controles';

function CampoColor({ label, ayuda, valor, error, onChange }: { label: string; ayuda: string; valor: string; error?: string; onChange: (v: string) => void }) {
  const hex = normalizarHex(valor);
  return (
    <Campo
      label={label}
      value={valor}
      onChangeText={(v) => onChange(normalizarHex(v) ?? v.toUpperCase())}
      error={error}
      ayuda={ayuda}
      autoCapitalize="characters"
      maxLength={7}
      derecha={<View className="h-10 w-10 rounded-lg border border-border" style={{ backgroundColor: hex ?? '#FFFFFF' }} />}
    />
  );
}

/** Colores y estilo: paletas, principal + acento (con contraste vigilado) y estilo según plan. */
export function SeccionColores({ ed }: { ed: EditorMarca }) {
  const { vista: v, errores: e, actualizar, mi } = ed;
  const aviso = normalizarHex(v.colorPrimario) ? errorContraste(v.colorPrimario, v.modo) : null;
  return (
    <View className="gap-4">
      <Text className="text-sm font-semibold text-foreground">Paletas sugeridas</Text>
      <View className="flex-row flex-wrap gap-2">
        {CODIGOS_PALETA.map((c) => {
          const activa = PALETAS[c].primario === v.colorPrimario && PALETAS[c].acento === v.colorAcento;
          return (
            <Pressable key={c} onPress={() => actualizar((b) => ({ ...b, colorPrimario: PALETAS[c].primario, colorAcento: PALETAS[c].acento }))} className={cn('flex-row items-center gap-1.5 rounded-full border px-3 py-1.5', activa ? 'border-primary bg-primary/5' : 'border-border')}>
              <View className="h-4 w-4 rounded-full" style={{ backgroundColor: PALETAS[c].primario }} />
              <View className="-ml-2.5 h-4 w-4 rounded-full border border-white" style={{ backgroundColor: PALETAS[c].acento }} />
              <Text className="text-xs text-foreground">{PALETAS[c].nombre}</Text>
            </Pressable>
          );
        })}
      </View>
      <CampoColor label="Color principal" ayuda="Botones, enlaces y cabecera activa." valor={v.colorPrimario} error={aviso ? undefined : e.colorPrimario} onChange={(colorPrimario) => actualizar((b) => ({ ...b, colorPrimario }))} />
      <CampoColor label="Color de acento" ayuda="Etiquetas como Nuevo, el carrito y detalles." valor={v.colorAcento} error={e.colorAcento} onChange={(colorAcento) => actualizar((b) => ({ ...b, colorAcento }))} />
      {aviso && (
        <View className="gap-2">
          <Aviso tono="alerta" texto={aviso} />
          <Button size="sm" variant="outline" className="self-start" onPress={() => actualizar((b) => ({ ...b, colorPrimario: ajustarContraste(v.colorPrimario, v.modo) }))}>
            <Text>Ajustar contraste</Text>
          </Button>
        </View>
      )}
      <Candado titulo="Estilo" nivel="COMPLETA" bloqueado={!mi.permitido.estilo}>
        <View className="gap-3">
          <FilaSwitch titulo="Modo oscuro" detalle="Fondo casi negro y textos claros en toda la tienda." valor={v.modo === 'OSCURO'} onCambiar={(on) => actualizar((b) => ({ ...b, modo: on ? 'OSCURO' : 'CLARO' }))} />
          <Text className="text-sm font-medium text-foreground">Forma de los bordes</Text>
          <Opciones<RadioMarca> opciones={(Object.keys(RADIOS) as RadioMarca[]).map((r) => ({ valor: r, label: RADIOS[r].nombre }))} valor={v.radio} onCambiar={(radio) => actualizar((b) => ({ ...b, radio }))} />
          <Text className="text-sm font-medium text-foreground">Fuente de títulos</Text>
          <Opciones<FuenteMarca> opciones={(Object.keys(FUENTES) as FuenteMarca[]).map((f) => ({ valor: f, label: FUENTES[f].nombre }))} valor={v.fuente} onCambiar={(fuente) => actualizar((b) => ({ ...b, fuente }))} />
        </View>
      </Candado>
    </View>
  );
}
