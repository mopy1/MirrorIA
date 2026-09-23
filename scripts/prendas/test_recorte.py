# -*- coding: utf-8 -*-
"""Pruebas del recorte, con imagenes sinteticas: nada de red ni de IA."""
import contextlib
import io
import unittest

import numpy as np
from PIL import Image, ImageFilter

from recorte import linea_de_anclaje, normalizar, quitar_croma

MAGENTA = (198, 51, 131)


def prenda_de_prueba(ancho=400, alto=600, hombros_y=100, hombros_ancho=200):
    """Una 'prenda' sobre fondo croma: un trapecio azul con hombros anchos."""
    im = Image.new("RGB", (ancho, alto), MAGENTA)
    px = im.load()
    for y in range(hombros_y, alto - 50):
        mitad = hombros_ancho // 2 if y < hombros_y + 20 else hombros_ancho // 2 - 30
        for x in range(ancho // 2 - mitad, ancho // 2 + mitad):
            px[x, y] = (20, 40, 200)
    return im


def prenda_con_tirantes_finos(ancho=400, alto=600, hombros_y=100, hombros_ancho=200,
                               tirante_ancho=2, tirante_alto=40, color=(0, 0, 0), radio_blur=1.0):
    """La prenda de prueba de siempre, con dos tirantes finos (2 px, casi
    negros) que suben desde los hombros: para probar el halo del
    Hallazgo 1.

    Se le pasa un desenfoque gaussiano leve (Pillow trae ImageFilter, no
    es una dependencia nueva) para simular el degrade que deja una
    compresion JPEG real en el borde de un rasgo tan angosto: sin ese
    desenfoque, un tirante dibujado a pixel duro no genera ningun pixel
    de transicion (0 < alfa < 1) alrededor, y el bug no se reproduce. Con
    el desenfoque, el tirante queda con su centro opaco (alfa=255) pero
    con tinte magenta, que es exactamente el caso que reporto el revisor.
    """
    im = prenda_de_prueba(ancho, alto, hombros_y, hombros_ancho)
    px = im.load()
    x_izq = ancho // 2 - hombros_ancho // 2 + 10
    x_der = ancho // 2 + hombros_ancho // 2 - 10 - tirante_ancho
    for y in range(hombros_y - tirante_alto, hombros_y):
        for dx in range(tirante_ancho):
            px[x_izq + dx, y] = color
            px[x_der + dx, y] = color
    return im.filter(ImageFilter.GaussianBlur(radio_blur))


def prenda_de_color(color, ancho=400, alto=600, hombros_y=100, hombros_ancho=200):
    """Como prenda_de_prueba pero con la tela del color que se pida: sirve
    para probar que el despill no desatura una prenda calida (Hallazgo 1,
    el limite de "no te pases de rosca")."""
    im = Image.new("RGB", (ancho, alto), MAGENTA)
    px = im.load()
    for y in range(hombros_y, alto - 50):
        mitad = hombros_ancho // 2 if y < hombros_y + 20 else hombros_ancho // 2 - 30
        for x in range(ancho // 2 - mitad, ancho // 2 + mitad):
            px[x, y] = color
    return im


def prenda_asimetrica(ancho=600, alto=600, hombros_y=100, hombros_ancho=200, corrimiento=-140):
    """Como prenda_de_prueba, pero el cuerpo (debajo de los hombros) se
    recuesta fuerte hacia un costado respecto de la linea de hombros:
    para probar el Hallazgo 2 (el clamp de destino_x/destino_y)."""
    im = Image.new("RGB", (ancho, alto), MAGENTA)
    px = im.load()
    centro = ancho // 2
    mitad = hombros_ancho // 2
    for y in range(hombros_y, hombros_y + 20):
        for x in range(centro - mitad, centro + mitad):
            px[x, y] = (20, 40, 200)
    for y in range(hombros_y + 20, alto - 50):
        x0 = max(0, centro - mitad + 30 + corrimiento)
        x1 = min(ancho, centro + mitad - 30 + corrimiento)
        for x in range(x0, x1):
            px[x, y] = (20, 40, 200)
    return im


def _fraccion_y_de_la_linea(imagen_rgba):
    """Ayuda de prueba (no de produccion): a que fraccion de la altura cae
    la fila mas ancha del tercio superior opaco. Sirve para comprobar el
    24% de FRACCION_ALTO sin depender de un helper interno del modulo."""
    alfa = np.asarray(imagen_rgba.split()[-1]).astype(float) / 255
    filas = np.where(alfa.max(axis=1) > 0.5)[0]
    arriba, abajo = filas[0], filas[-1]
    hasta = arriba + max(1, int((abajo - arriba) * 0.33))
    mejor_ancho, mejor_y = 0.0, float(arriba)
    for y in range(arriba, hasta):
        columnas = np.where(alfa[y] > 0.5)[0]
        if len(columnas) >= 2 and float(columnas[-1] - columnas[0]) > mejor_ancho:
            mejor_ancho = float(columnas[-1] - columnas[0])
            mejor_y = float(y)
    return mejor_y / imagen_rgba.height


class QuitarCroma(unittest.TestCase):
    def test_el_fondo_queda_transparente(self):
        rgba = quitar_croma(prenda_de_prueba())
        self.assertEqual(rgba.mode, "RGBA")
        self.assertEqual(rgba.getpixel((0, 0))[3], 0)

    def test_la_prenda_queda_opaca(self):
        rgba = quitar_croma(prenda_de_prueba())
        self.assertEqual(rgba.getpixel((200, 300))[3], 255)

    def test_no_deja_tinte_magenta_en_la_prenda(self):
        r, g, b, _ = quitar_croma(prenda_de_prueba()).getpixel((200, 300))
        self.assertLess(r, 80)
        self.assertLess(b, 255)


class LineaDeAnclaje(unittest.TestCase):
    def test_encuentra_el_ancho_de_los_hombros(self):
        rgba = quitar_croma(prenda_de_prueba(hombros_ancho=200))
        centro_x, ancho = linea_de_anclaje(rgba)
        self.assertAlmostEqual(centro_x, 200, delta=6)
        self.assertAlmostEqual(ancho, 200, delta=12)


class Normalizar(unittest.TestCase):
    def test_deja_la_linea_donde_manda_la_convencion(self):
        salida = normalizar(quitar_croma(prenda_de_prueba()))
        centro_x, ancho = linea_de_anclaje(salida)
        self.assertAlmostEqual(ancho / salida.width, 0.65, delta=0.03)
        self.assertAlmostEqual(centro_x / salida.width, 0.50, delta=0.03)

    def test_no_pasa_del_lado_mayor_pedido(self):
        salida = normalizar(quitar_croma(prenda_de_prueba()), lado_mayor=800)
        self.assertLessEqual(max(salida.size), 800)


class HaloEnRasgosFinos(unittest.TestCase):
    """Hallazgo 1: un tirante mas angosto que la zona de degrade del croma
    quedaba opaco (alfa=255) pero con tinte magenta, porque el despill
    solo miraba el borde semitransparente."""

    def test_tirante_fino_sin_tinte_de_croma(self):
        rgba = quitar_croma(prenda_con_tirantes_finos())
        vistos = 0
        # el tirante izquierdo cae en x=110,111 (ver prenda_con_tirantes_finos);
        # se revisa una franja alrededor para no depender de un pixel exacto.
        for x in range(107, 114):
            for y in range(62, 98):
                r, g, b, a = rgba.getpixel((x, y))
                if a > 200:
                    vistos += 1
                    self.assertLess(r - g, 40, f"tinte de croma en ({x},{y}): {(r, g, b, a)}")
                    self.assertLess(b - g, 40, f"tinte de croma en ({x},{y}): {(r, g, b, a)}")
        self.assertGreater(vistos, 0, "no se encontraron pixeles opacos del tirante para revisar")

    def test_prenda_roja_no_se_destine(self):
        """El limite del arreglo anterior: no despillar tan fuerte que una
        prenda calida (roja) pierda su color en el centro."""
        r, g, b, a = quitar_croma(prenda_de_color((200, 30, 30))).getpixel((200, 300))
        self.assertEqual(a, 255)
        self.assertGreater(r - g, 100)


class ClampDeLaAsimetria(unittest.TestCase):
    """Hallazgo 2: max(destino_x, 0) recortaba el offset sin agrandar el
    lienzo, asi que una prenda asimetrica se desplazaba del 65%/24% sin
    ninguna excepcion ni aviso."""

    def test_la_linea_queda_centrada_y_a_la_altura_de_la_convencion(self):
        """Ojo con el nombre viejo (`test_no_rompe_la_convencion_...`):
        prometia mas de lo que verifica. Esto comprueba la POSICION de la
        linea de anclaje (centrada, al 24% de la altura), no la fraccion de
        ancho, que con una prenda asimetrica efectivamente deja de ser 0,65
        (ver la prueba de abajo)."""
        salida = normalizar(quitar_croma(prenda_asimetrica()))
        centro_x, _ = linea_de_anclaje(salida)
        self.assertAlmostEqual(centro_x / salida.width, 0.50, delta=0.03)
        self.assertAlmostEqual(_fraccion_y_de_la_linea(salida), 0.24, delta=0.03)

    def test_avisa_cuando_el_lienzo_se_ensancha_y_la_fraccion_deja_de_ser_065(self):
        """Lo que el nombre viejo daba a entender que no pasaba, pasa: al
        ensanchar el lienzo para no recortar la prenda, la linea de anclaje
        deja de medir el 65% del ancho. Se acepta (recortar seria peor) pero
        ahora se avisa por stderr en vez de pasar en silencio."""
        err = io.StringIO()
        with contextlib.redirect_stderr(err):
            salida = normalizar(quitar_croma(prenda_asimetrica()))
        _, ancho = linea_de_anclaje(salida)
        fraccion = ancho / salida.width
        self.assertLess(fraccion, 0.65 - 0.03, f"la fraccion fue {fraccion:.3f}")
        self.assertIn("aviso: prenda asimetrica", err.getvalue())
        self.assertIn("y no en 0.65", err.getvalue())

    def test_una_prenda_simetrica_no_imprime_ningun_aviso(self):
        err = io.StringIO()
        with contextlib.redirect_stderr(err):
            normalizar(quitar_croma(prenda_de_prueba()))
        self.assertEqual(err.getvalue(), "")


if __name__ == "__main__":
    unittest.main()
