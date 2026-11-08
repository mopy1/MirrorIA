import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Campo } from '../../saas/components/Campo';
import type { DestinoCta, HeroMarca, MarcaPublica } from '../../saas/types/saas.types';
import type { EditorMarca } from '../hooks/useEditorMarca';
import { opcional } from '../lib/marca-borrador';
import { DESTINOS } from '../lib/marca.constants';
import { CampoImagenUrl } from './CampoImagenUrl';
import { Candado, FilaSwitch, Opciones } from './Controles';

/** Marca: nombre visible, logo y favicon (plan Cadena). */
export function SeccionMarca({ ed }: { ed: EditorMarca }) {
  const { vista: v, errores: e, actualizar, mi } = ed;
  return (
    <View className="gap-4">
      <Campo label="Nombre de la tienda" value={v.nombre} maxLength={120} error={e.nombre} ayuda={`Tu dirección sigue siendo /t/${mi.slug}.`} onChangeText={(nombre) => actualizar((b) => ({ ...b, nombre }))} />
      <CampoImagenUrl label="Logo" value={v.logoUrl} error={e.logoUrl} ayuda="PNG con fondo transparente, más ancho que alto. Sin logo mostramos tus iniciales." onChange={(logoUrl) => actualizar((b) => ({ ...b, logoUrl }))} />
      <Candado titulo="Ícono de la pestaña" nivel="MARCA_BLANCA" bloqueado={!mi.permitido.favicon}>
        <CampoImagenUrl label="Favicon" value={v.faviconUrl} error={e.faviconUrl} ayuda="Cuadrado. Sin favicon usamos tu logo." onChange={(faviconUrl) => actualizar((b) => ({ ...b, faviconUrl }))} />
      </Candado>
    </View>
  );
}

/** Portada: imagen, textos y botón del inicio de la tienda. */
export function SeccionPortada({ ed }: { ed: EditorMarca }) {
  const { vista: v, errores: e, actualizar } = ed;
  const set = (c: Partial<HeroMarca>) => actualizar((b) => ({ ...b, hero: { ...b.hero, ...c } }));
  return (
    <View className="gap-4">
      <CampoImagenUrl label="Imagen de portada" obligatoria value={v.hero.imagenUrl} error={e['hero.imagenUrl']} ayuda="Horizontal y con la persona hacia la derecha." onChange={(u) => set({ imagenUrl: u ?? '' })} />
      <Campo label="Título" value={v.hero.titulo} maxLength={80} error={e['hero.titulo']} onChangeText={(titulo) => set({ titulo })} />
      <Campo label="Subtítulo (opcional)" value={v.hero.subtitulo} maxLength={160} error={e['hero.subtitulo']} onChangeText={(s) => set({ subtitulo: opcional(s) })} />
      <Campo label="Texto del botón" value={v.hero.ctaTexto} maxLength={24} error={e['hero.ctaTexto']} onChangeText={(ctaTexto) => set({ ctaTexto })} />
      <Text className="text-sm font-medium text-foreground">El botón lleva a</Text>
      <Opciones<DestinoCta> opciones={(Object.keys(DESTINOS) as DestinoCta[]).map((d) => ({ valor: d, label: DESTINOS[d].nombre }))} valor={v.hero.ctaDestino} onCambiar={(ctaDestino) => set({ ctaDestino })} />
      <FilaSwitch titulo='Botón "Probátela ahora"' detalle="Lleva al probador virtual con IA." valor={v.hero.mostrarProbador} onCambiar={(mostrarProbador) => set({ mostrarProbador })} />
    </View>
  );
}

/** Imágenes de las secciones (desde el plan Crecimiento). */
export function SeccionImagenes({ ed }: { ed: EditorMarca }) {
  const { vista: v, errores: e, actualizar, mi } = ed;
  const set = (c: Partial<MarcaPublica['imagenes']>) => actualizar((b) => ({ ...b, imagenes: { ...b.imagenes, ...c } }));
  return (
    <Candado titulo="Imágenes de las secciones" nivel="COMPLETA" bloqueado={!mi.permitido.imagenesSecciones}>
      <View className="gap-4">
        <CampoImagenUrl label="Banner de sucursales" value={v.imagenes.bannerSucursales} error={e['imagenes.bannerSucursales']} onChange={(bannerSucursales) => set({ bannerSucursales })} />
        <CampoImagenUrl label="Probador virtual" value={v.imagenes.probador} error={e['imagenes.probador']} onChange={(probador) => set({ probador })} />
        <CampoImagenUrl label="Pantalla de acceso" value={v.imagenes.acceso} error={e['imagenes.acceso']} onChange={(acceso) => set({ acceso })} />
      </View>
    </Candado>
  );
}

type ClaveContacto = keyof MarcaPublica['contacto'];
const CONTACTO: { clave: ClaveContacto; label: string; prefijo?: string; placeholder: string }[] = [
  { clave: 'instagram', label: 'Instagram', prefijo: '@', placeholder: 'casaandina' },
  { clave: 'facebook', label: 'Facebook', prefijo: 'facebook.com/', placeholder: 'casaandina' },
  { clave: 'tiktok', label: 'TikTok', prefijo: '@', placeholder: 'casaandina' },
  { clave: 'whatsapp', label: 'WhatsApp', placeholder: '+59170012345' },
  { clave: 'email', label: 'Email de contacto', placeholder: 'hola@casaandina.bo' },
];

/** Textos y contacto: eslogan, "sobre nosotras", redes e insignia (quitarla: plan Cadena). */
export function SeccionTextos({ ed }: { ed: EditorMarca }) {
  const { vista: v, errores: e, actualizar, mi } = ed;
  return (
    <View className="gap-4">
      <Campo label="Eslogan (opcional)" value={v.textos.eslogan} maxLength={120} error={e['textos.eslogan']} ayuda="Va bajo tu logo y en el directorio de MirrorIA." onChangeText={(s) => actualizar((b) => ({ ...b, textos: { ...b.textos, eslogan: opcional(s) } }))} />
      <Campo label="Sobre nosotras (opcional)" multiline value={v.textos.sobreNosotros} maxLength={600} error={e['textos.sobreNosotros']} onChangeText={(s) => actualizar((b) => ({ ...b, textos: { ...b.textos, sobreNosotros: opcional(s) } }))} />
      <Text className="text-sm font-semibold text-foreground">Redes y contacto</Text>
      {CONTACTO.map((c) => (
        <Campo key={c.clave} label={c.label} prefijo={c.prefijo} placeholder={c.placeholder} autoCapitalize="none" value={v.contacto[c.clave]} error={e[`contacto.${c.clave}`]} onChangeText={(s) => actualizar((b) => ({ ...b, contacto: { ...b.contacto, [c.clave]: opcional(s.replace(/^@/, '')) } }))} />
      ))}
      <Candado titulo="Marca blanca" nivel="MARCA_BLANCA" bloqueado={!mi.permitido.quitarInsignia}>
        <FilaSwitch titulo='Mostrar "Hecho con MirrorIA"' detalle="La insignia del pie de tu tienda." valor={v.mostrarInsignia} onCambiar={(mostrarInsignia) => actualizar((b) => ({ ...b, mostrarInsignia }))} />
      </Candado>
    </View>
  );
}
