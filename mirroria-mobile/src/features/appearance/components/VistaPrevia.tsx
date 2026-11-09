import React from 'react';
import { ImageBackground, Platform, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { LogoTienda } from '../../saas/components/LogoTienda';
import { logoParaApp } from '../../saas/lib/marca-tienda';
import { FONDO_TIENDA, normalizarHex, textoSobre } from '../lib/color';
import { RADIOS } from '../lib/marca.constants';
import type { BorradorMarca } from '../types/apariencia.types';

/** Así se ve el inicio de la tienda con el borrador (modo, colores, bordes, portada), antes de guardar. */
export function VistaPrevia({ marca, sucio }: { marca: BorradorMarca; sucio: boolean }) {
  const fondo = FONDO_TIENDA[marca.modo];
  const tinta = marca.modo === 'OSCURO' ? '#FAFAFA' : '#0A0A0A';
  const principal = normalizarHex(marca.colorPrimario) ?? '#26282E';
  const acento = normalizarHex(marca.colorAcento) ?? '#E3C14B';
  const radio = RADIOS[marca.radio].valor;
  const portada = marca.hero.imagenUrl?.startsWith('https://') ? { uri: marca.hero.imagenUrl } : undefined;

  return (
    <View className="gap-1.5">
      <Text className="text-xs text-muted-foreground">Vista previa{sucio ? ' · cambios sin guardar' : ''}</Text>
      <View style={{ backgroundColor: fondo, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E5E5' }}>
        <View className="flex-row items-center gap-2 px-3 py-2.5">
          <LogoTienda nombre={marca.nombre || 'T'} logoUrl={logoParaApp(marca.logoUrl, Platform.OS === 'web')} color={principal} tamano={26} />
          <Text numberOfLines={1} style={{ color: tinta }} className="flex-1 text-sm font-bold">{marca.nombre || 'Tu tienda'}</Text>
          <View style={{ backgroundColor: acento, borderRadius: radio }} className="px-2 py-0.5">
            <Text style={{ color: textoSobre(acento) }} className="text-[10px] font-semibold">Nuevo</Text>
          </View>
        </View>
        <ImageBackground source={portada} style={{ height: 150, backgroundColor: principal }} resizeMode="cover">
          <View style={{ flex: 1, justifyContent: 'flex-end', padding: 12, backgroundColor: 'rgba(0,0,0,0.35)' }}>
            <Text numberOfLines={2} className="text-base font-bold text-white">{marca.hero.titulo}</Text>
            {marca.hero.subtitulo ? <Text numberOfLines={2} className="text-[11px] text-white/85">{marca.hero.subtitulo}</Text> : null}
            <View className="mt-2 flex-row gap-2">
              <View style={{ backgroundColor: principal, borderRadius: radio }} className="px-3 py-1.5">
                <Text style={{ color: textoSobre(principal) }} className="text-xs font-semibold">{marca.hero.ctaTexto || 'Ver catálogo'}</Text>
              </View>
              {marca.hero.mostrarProbador && (
                <View style={{ backgroundColor: '#FFFFFF', borderRadius: radio }} className="px-3 py-1.5">
                  <Text className="text-xs font-semibold text-black">Probátela ahora</Text>
                </View>
              )}
            </View>
          </View>
        </ImageBackground>
        <View className="px-3 py-2.5">
          <Text style={{ color: principal }} className="text-xs font-semibold">Ver catálogo →</Text>
          {marca.textos.eslogan ? <Text style={{ color: tinta, opacity: 0.7 }} className="text-[11px]">{marca.textos.eslogan}</Text> : null}
          {marca.mostrarInsignia && <Text style={{ color: tinta, opacity: 0.5 }} className="mt-1 text-[10px]">Hecho con MirrorIA</Text>}
        </View>
      </View>
    </View>
  );
}
