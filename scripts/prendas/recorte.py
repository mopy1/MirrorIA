# -*- coding: utf-8 -*-
"""Convierte la salida del modelo (prenda sobre fondo croma) en un PNG con
alfa, normalizado a la convencion de anclaje que ya usa el movil.

El modelo devuelve JPEG, no PNG: el fondo viene con compresion, asi que el
umbral tiene degrade y hace falta despill en el borde. No son adornos.
"""
import math
import sys

import numpy as np
from PIL import Image

# La linea de anclaje cae al 65% del ancho y al 24% de la altura
# (STANDARD_GARMENT_ANCHOR del movil).
FRACCION_ANCHO = 0.65
FRACCION_ALTO = 0.24


def _dilatar(mascara, veces=4):
    """Agranda una mascara booleana `veces` pixeles hacia los cuatro
    lados (sin diagonales), sin depender de scipy: corre la mascara en
    cada direccion y hace OR, y repite. Sirve para pasar de "el borde
    exacto" a "una banda alrededor del borde"."""
    m = mascara
    for _ in range(veces):
        vecinos = np.zeros_like(m)
        vecinos[1:, :] |= m[:-1, :]
        vecinos[:-1, :] |= m[1:, :]
        vecinos[:, 1:] |= m[:, :-1]
        vecinos[:, :-1] |= m[:, 1:]
        m = m | vecinos
    return m


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
    #
    # Un rasgo mas angosto que la zona de degrade (un tirante, un
    # encaje) puede terminar completamente OPACO (alfa=1, d >= hi) pese
    # a seguir siendo una mezcla optica con el fondo: la transicion real
    # que rodea a los DOS bordes del rasgo se solapa y nunca queda un
    # pixel con 0 < alfa < 1 en el medio. Por eso el despill no se limita
    # al borde exacto: se aplica a una banda de unos pocos pixeles
    # alrededor de la transicion, sea cual sea la opacidad ahi dentro.
    # Una prenda de un color solido y bien saturado (roja, por ejemplo)
    # no se ve afectada: la banda es angosta y su centro queda lejos.
    rgb = a.copy()
    canal_limpio = int(np.argmin(fondo))
    referencia = rgb[:, :, canal_limpio]
    transicion = (alfa > 0) & (alfa < 1)
    cerca_del_fondo = _dilatar(transicion, veces=5)
    for canal in range(3):
        if canal == canal_limpio:
            continue
        exceso = rgb[:, :, canal] - referencia
        rgb[:, :, canal] = np.where(cerca_del_fondo & (exceso > 0), referencia + exceso * 0.3, rgb[:, :, canal])

    return Image.fromarray(np.dstack([rgb, alfa * 255]).astype(np.uint8), "RGBA")


def _fila_mas_ancha_tercio_superior(alfa):
    """(y, centro_x, ancho), en px, de la fila mas ancha del tercio
    superior de la zona opaca de `alfa` (array 2D, valores en [0, 1]).

    En una prenda de arriba eso es la linea de hombros; en una falda o un
    pantalon, la cintura, que es justo donde hay que colgarla. La usan
    tanto `linea_de_anclaje` como `normalizar`, para no medir lo mismo
    con dos criterios que se puedan desincronizar.
    """
    filas_con_prenda = np.where(alfa.max(axis=1) > 0.5)[0]
    if len(filas_con_prenda) == 0:
        raise ValueError("la imagen quedo vacia: no hay prenda que medir")

    arriba = filas_con_prenda[0]
    abajo = filas_con_prenda[-1]
    hasta = arriba + max(1, int((abajo - arriba) * 0.33))

    mejor_ancho, mejor_centro, mejor_y = 0.0, alfa.shape[1] / 2, float(arriba)
    for y in range(arriba, hasta):
        columnas = np.where(alfa[y] > 0.5)[0]
        if len(columnas) < 2:
            continue
        ancho = float(columnas[-1] - columnas[0])
        if ancho > mejor_ancho:
            mejor_ancho = ancho
            mejor_centro = float(columnas[0] + columnas[-1]) / 2
            mejor_y = float(y)
    return mejor_y, mejor_centro, mejor_ancho


def linea_de_anclaje(imagen_rgba):
    """Centro y ancho (px) de la linea mas ancha del tercio superior opaco."""
    alfa = np.asarray(imagen_rgba.split()[-1]).astype(float) / 255
    _, centro, ancho = _fila_mas_ancha_tercio_superior(alfa)
    return centro, ancho


def _lado_sin_recorte(fraccion, antes, despues):
    """Lado minimo (px) de un lienzo para que un punto que cae a `antes`
    px de un extremo de la imagen de origen (y `despues` px del otro)
    quede exactamente a `fraccion` del lienzo sin que nada se salga.

    Si el punto no esta centrado en su propia imagen, alguno de los dos
    lados manda: el que pida mas espacio segun su fraccion."""
    return max(antes / fraccion, despues / (1 - fraccion))


def normalizar(imagen_rgba, lado_mayor=800):
    """Recorta al contenido y encuadra para que la linea de anclaje caiga
    donde manda la convencion, rellenando con transparencia."""
    imagen_rgba = imagen_rgba.crop(imagen_rgba.getbbox())
    alfa = np.asarray(imagen_rgba.split()[-1]).astype(float) / 255
    y_linea, centro_x, ancho_linea = _fila_mas_ancha_tercio_superior(alfa)
    if ancho_linea <= 0:
        raise ValueError("no se pudo medir la linea de anclaje")

    # El lienzo se dimensiona para que `ancho_linea` sea el 65% de su
    # ancho... pero si la prenda es asimetrica (su contenido no esta
    # centrado respecto de la linea de anclaje), ese ancho puede no
    # alcanzar para que entre todo sin recortar nada. En ese caso se
    # agranda el lienzo lo necesario en vez de recortar el offset: un
    # `max(destino, 0)` tapaba esto en silencio y corria la linea del
    # 65%/24% sin ningun aviso.
    ancho_por_convencion = ancho_linea / FRACCION_ANCHO
    ancho_sin_recorte = _lado_sin_recorte(0.5, centro_x, imagen_rgba.width - centro_x)
    ancho_lienzo = int(math.ceil(max(ancho_por_convencion, ancho_sin_recorte)))

    # Cuando manda `ancho_sin_recorte`, el lienzo queda MAS ancho que el que
    # pide la convencion y la linea de anclaje deja de medir el 65% del
    # ancho: sigue centrada y a la altura correcta, pero el probador, que
    # escala la prenda dividiendo por esa fraccion, la dibujaria mas angosta
    # que los hombros de la clienta. No es un error (recortar la prenda
    # seria peor), pero antes pasaba en silencio.
    if ancho_sin_recorte > ancho_por_convencion:
        fraccion_real = ancho_linea / ancho_lienzo
        print(
            f"aviso: prenda asimetrica: el lienzo se ensancho de "
            f"{int(math.ceil(ancho_por_convencion))} a {ancho_lienzo} px para no recortarla, "
            f"asi que la linea de anclaje queda en {fraccion_real:.3f} del ancho "
            f"y no en {FRACCION_ANCHO}",
            file=sys.stderr,
        )

    alto_lienzo = int(math.ceil(
        _lado_sin_recorte(FRACCION_ALTO, y_linea, imagen_rgba.height - y_linea)
    ))

    lienzo = Image.new("RGBA", (ancho_lienzo, alto_lienzo), (0, 0, 0, 0))
    destino_x = int(round(ancho_lienzo * 0.5 - centro_x))
    destino_y = int(round(alto_lienzo * FRACCION_ALTO - y_linea))
    # El calculo de arriba ya garantiza offsets >= 0; el max() que sigue
    # es solo para el redondeo al borde, no una segunda linea de defensa
    # contra la asimetria (esa la resuelve el tamano del lienzo).
    lienzo.alpha_composite(imagen_rgba, (max(destino_x, 0), max(destino_y, 0)))

    if max(lienzo.size) > lado_mayor:
        escala = lado_mayor / max(lienzo.size)
        lienzo = lienzo.resize(
            (max(1, int(lienzo.width * escala)), max(1, int(lienzo.height * escala))),
            Image.LANCZOS,
        )
    return lienzo
