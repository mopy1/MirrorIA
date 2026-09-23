# -*- coding: utf-8 -*-
"""Pruebas del recorte, con imagenes sinteticas: nada de red ni de IA."""
import unittest

from PIL import Image

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


if __name__ == "__main__":
    unittest.main()
