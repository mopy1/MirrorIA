# -*- coding: utf-8 -*-
"""Convierte la salida del modelo (prenda sobre fondo croma) en un PNG con
alfa, normalizado a la convencion de anclaje que ya usa el movil.

El modelo devuelve JPEG, no PNG: el fondo viene con compresion, asi que el
umbral tiene degrade y hace falta despill en el borde. No son adornos.
"""
import numpy as np
from PIL import Image

# La linea de anclaje cae al 65% del ancho y al 24% de la altura
# (STANDARD_GARMENT_ANCHOR del movil).
FRACCION_ANCHO = 0.65
FRACCION_ALTO = 0.24


def quitar_croma(imagen_rgb, suave=(45, 85)):
    """Fondo croma -> alfa. El color de fondo se deduce del borde."""
    a = np.asarray(imagen_rgb.convert("RGB")).astype(float)
    h, w, _ = a.shape
    borde = np.concatenate([a[0, :, :], a[h - 1, :, :], a[:, 0, :], a[:, w - 1, :]])
    fondo = np.median(borde, axis=0)

    d = np.sqrt(((a - fondo) ** 2).sum(axis=2))
    lo, hi = suave
    alfa = np.clip((d - lo) / (hi - lo), 0, 1)

    # Despill: al borde le queda tinte del croma. Se bajan los canales
    # dominantes del fondo hacia el canal que el croma casi no usa.
    rgb = a.copy()
    canal_limpio = int(np.argmin(fondo))
    referencia = rgb[:, :, canal_limpio]
    en_borde = (alfa > 0) & (alfa < 1)
    for canal in range(3):
        if canal == canal_limpio:
            continue
        exceso = rgb[:, :, canal] - referencia
        rgb[:, :, canal] = np.where(en_borde & (exceso > 0), referencia + exceso * 0.3, rgb[:, :, canal])

    return Image.fromarray(np.dstack([rgb, alfa * 255]).astype(np.uint8), "RGBA")


def linea_de_anclaje(imagen_rgba):
    """Centro y ancho (px) de la linea mas ancha del tercio superior opaco.

    En una prenda de arriba eso es la linea de hombros; en una falda o un
    pantalon, la cintura, que es justo donde hay que colgarla.
    """
    alfa = np.asarray(imagen_rgba.split()[-1]).astype(float) / 255
    filas_con_prenda = np.where(alfa.max(axis=1) > 0.5)[0]
    if len(filas_con_prenda) == 0:
        raise ValueError("la imagen quedo vacia: no hay prenda que medir")

    arriba = filas_con_prenda[0]
    abajo = filas_con_prenda[-1]
    hasta = arriba + max(1, int((abajo - arriba) * 0.33))

    mejor_ancho, mejor_centro = 0.0, imagen_rgba.width / 2
    for y in range(arriba, hasta):
        columnas = np.where(alfa[y] > 0.5)[0]
        if len(columnas) < 2:
            continue
        ancho = float(columnas[-1] - columnas[0])
        if ancho > mejor_ancho:
            mejor_ancho = ancho
            mejor_centro = float(columnas[0] + columnas[-1]) / 2
    return mejor_centro, mejor_ancho


def normalizar(imagen_rgba, lado_mayor=800):
    """Recorta al contenido y encuadra para que la linea de anclaje caiga
    donde manda la convencion, rellenando con transparencia."""
    imagen_rgba = imagen_rgba.crop(imagen_rgba.getbbox())
    centro_x, ancho_linea = linea_de_anclaje(imagen_rgba)
    if ancho_linea <= 0:
        raise ValueError("no se pudo medir la linea de anclaje")

    # El lienzo se dimensiona para que `ancho_linea` sea el 65% de su ancho.
    ancho_lienzo = int(round(ancho_linea / FRACCION_ANCHO))
    # La linea esta a `y_linea` del recorte; debe quedar al 24% del alto.
    alfa = np.asarray(imagen_rgba.split()[-1]).astype(float) / 255
    filas = np.where(alfa.max(axis=1) > 0.5)[0]
    y_linea = 0.0
    mejor = 0.0
    hasta = filas[0] + max(1, int((filas[-1] - filas[0]) * 0.33))
    for y in range(filas[0], hasta):
        cols = np.where(alfa[y] > 0.5)[0]
        if len(cols) >= 2 and float(cols[-1] - cols[0]) > mejor:
            mejor = float(cols[-1] - cols[0])
            y_linea = float(y)

    alto_lienzo = max(int(round(y_linea / FRACCION_ALTO)),
                      int(round(imagen_rgba.height + y_linea * (1 / FRACCION_ALTO - 1))))
    lienzo = Image.new("RGBA", (ancho_lienzo, alto_lienzo), (0, 0, 0, 0))
    destino_x = int(round(ancho_lienzo * 0.5 - centro_x))
    destino_y = int(round(alto_lienzo * FRACCION_ALTO - y_linea))
    lienzo.alpha_composite(imagen_rgba, (max(destino_x, 0), max(destino_y, 0)))

    if max(lienzo.size) > lado_mayor:
        escala = lado_mayor / max(lienzo.size)
        lienzo = lienzo.resize(
            (max(1, int(lienzo.width * escala)), max(1, int(lienzo.height * escala))),
            Image.LANCZOS,
        )
    return lienzo
