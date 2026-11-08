import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { PantallaAdmin } from '@/components/admin/PantallaAdmin';
import { Cargando, ErrorVista } from '@/components/admin/Estados';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { useAuth } from '@/src/hooks/useAuth';
import { Aviso } from '../../saas/components/Aviso';
import { useRecurso } from '../../saas/hooks/useRecurso';
import { NIVELES } from '../../saas/lib/limites';
import { aparienciaApi } from '../api/aparienciaApi';
import { RestablecerHoja } from '../components/RestablecerHoja';
import { SeccionColores } from '../components/SeccionColores';
import { SeccionImagenes, SeccionMarca, SeccionPortada, SeccionTextos } from '../components/SeccionesTexto';
import { VistaPrevia } from '../components/VistaPrevia';
import { useEditorMarca } from '../hooks/useEditorMarca';
import type { MiMarcaDto, PestanaApariencia } from '../types/apariencia.types';

const PESTANAS: { id: PestanaApariencia; label: string }[] = [
  { id: 'marca', label: 'Marca' },
  { id: 'colores', label: 'Colores y estilo' },
  { id: 'portada', label: 'Portada' },
  { id: 'imagenes', label: 'Imágenes' },
  { id: 'textos', label: 'Textos y contacto' },
];

/** `/admin/apariencia` (solo ADMIN): la marca de la tienda, con lo que permite su plan. */
export function AparienciaScreen() {
  const { user } = useAuth();
  const esAdmin = user?.role === 'ADMIN';
  const mi = useRecurso(aparienciaApi.getMiMarca, esAdmin, 'No se pudo cargar la apariencia');

  if (!esAdmin) {
    return (
      <PantallaAdmin titulo="Apariencia">
        <Aviso tono="info" texto="Solo la dueña de la tienda (administradora) puede cambiar la apariencia." />
      </PantallaAdmin>
    );
  }
  if (!mi.data) {
    return (
      <PantallaAdmin titulo="Apariencia" onRecargar={mi.reload} recargando={mi.isLoading}>
        {mi.isLoading ? <Cargando texto="Cargando tu marca…" /> : <ErrorVista mensaje={mi.error ?? 'Sin datos'} onReintentar={mi.reload} />}
      </PantallaAdmin>
    );
  }
  return <Editor mi={mi.data} onActualizado={mi.setData} />;
}

function Editor({ mi, onActualizado }: { mi: MiMarcaDto; onActualizado: (m: MiMarcaDto) => void }) {
  const ed = useEditorMarca(mi, onActualizado);
  const [pestana, setPestana] = useState<PestanaApariencia>('marca');
  const [restablecer, setRestablecer] = useState(false);

  return (
    <PantallaAdmin
      titulo="Apariencia"
      subtitulo={`Plan ${mi.planNombre}: ${NIVELES[mi.nivel]?.resumen ?? ''}`}
      accion={
        <Button size="sm" variant="outline" onPress={() => setRestablecer(true)}>
          <Text>Restablecer</Text>
        </Button>
      }
    >
      {ed.error && <Aviso tono="error" texto={ed.error} />}
      {ed.guardadoOk && !ed.sucio && <Aviso tono="exito" texto="Listo. Tu tienda ya se ve así para tus clientas." />}
      <VistaPrevia marca={ed.vista} sucio={ed.sucio} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
        {PESTANAS.map((p) => (
          <Pressable key={p.id} onPress={() => setPestana(p.id)} aria-selected={pestana === p.id} className={cn('rounded-full border px-3.5 py-2', pestana === p.id ? 'border-foreground bg-foreground' : 'border-border')}>
            <Text className={cn('text-xs font-semibold', pestana === p.id ? 'text-background' : 'text-foreground')}>{p.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View className="rounded-2xl border border-border bg-card p-4">
        {pestana === 'marca' && <SeccionMarca ed={ed} />}
        {pestana === 'colores' && <SeccionColores ed={ed} />}
        {pestana === 'portada' && <SeccionPortada ed={ed} />}
        {pestana === 'imagenes' && <SeccionImagenes ed={ed} />}
        {pestana === 'textos' && <SeccionTextos ed={ed} />}
      </View>

      {ed.sucio && (
        <View className="gap-2 rounded-2xl border border-primary/30 bg-primary/5 p-3">
          <Text className="text-sm text-foreground">{ed.valido ? 'Tenés cambios sin guardar.' : 'Revisá los campos marcados antes de guardar.'}</Text>
          <View className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onPress={ed.descartar} disabled={ed.enCurso === 'guardar'}>
              <Text>Descartar</Text>
            </Button>
            <Button className="flex-1" onPress={ed.guardar} disabled={!ed.valido || ed.enCurso === 'guardar'}>
              <Text>{ed.enCurso === 'guardar' ? 'Guardando…' : 'Guardar cambios'}</Text>
            </Button>
          </View>
        </View>
      )}
      <RestablecerHoja key={String(restablecer)} visible={restablecer} enCurso={ed.enCurso === 'restablecer'} onCerrar={() => setRestablecer(false)} onConfirmar={ed.restablecer} />
    </PantallaAdmin>
  );
}
