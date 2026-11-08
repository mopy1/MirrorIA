import React, { useState } from 'react';
import { Image, View } from 'react-native';
import { Campo } from '../../saas/components/Campo';
import { opcional } from '../lib/marca-borrador';

interface Props {
  label: string;
  value: string | null;
  error?: string;
  ayuda?: string;
  obligatoria?: boolean;
  onChange: (v: string | null) => void;
}

/** Imagen por enlace https (como la web): campo + miniatura si el enlace carga. */
export function CampoImagenUrl({ label, value, error, ayuda, obligatoria, onChange }: Props) {
  const [fallo, setFallo] = useState<string | null>(null);
  const mostrar = value && value.startsWith('https://') && fallo !== value;
  return (
    <View className="gap-2">
      <Campo
        label={label}
        value={value}
        onChangeText={(v) => onChange(obligatoria ? v : opcional(v))}
        error={error}
        ayuda={ayuda}
        placeholder="https://…"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />
      {mostrar ? (
        <Image source={{ uri: value }} onError={() => setFallo(value)} style={{ width: '100%', height: 110, borderRadius: 12 }} resizeMode="cover" accessibilityLabel={`Vista de ${label}`} />
      ) : null}
    </View>
  );
}
