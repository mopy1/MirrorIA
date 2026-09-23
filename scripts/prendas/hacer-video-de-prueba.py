# -*- coding: utf-8 -*-
"""Arma un .y4m con una persona, para la camara simulada de Chromium.

Chromium acepta `--use-file-for-fake-video-capture=<archivo.y4m>` y repite ese
video como si fuera la webcam. Asi se puede probar el probador de punta a punta
sin camara fisica y sin una persona delante.

El video es una sola foto repetida: al detector de pose le alcanza con un
cuadro, no necesita movimiento.

  python hacer-video-de-prueba.py salida.y4m [--foto <slug de burst>]
"""
import argparse
import urllib.request

import numpy as np
from PIL import Image

# Una persona de cuerpo entero, de frente y con los hombros despejados: es lo
# que el detector necesita para encontrar los landmarks 11 y 12.
FOTO_POR_DEFECTO = "model-in-heels-and-overalls-with-blue"
ANCHO, ALTO, CUADROS = 640, 480, 30


def bajar(slug):
    url = f"https://burst.shopifycdn.com/photos/{slug}.jpg?width=1200"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return Image.open(urllib.request.io.BytesIO(r.read())) if False else Image.open(__import__("io").BytesIO(r.read()))


def encuadrar(im, ancho, alto):
    """Recorta al centro conservando la proporcion pedida."""
    im = im.convert("RGB")
    objetivo = ancho / alto
    actual = im.width / im.height
    if actual > objetivo:
        nuevo = int(im.height * objetivo)
        izq = (im.width - nuevo) // 2
        im = im.crop((izq, 0, izq + nuevo, im.height))
    else:
        nuevo = int(im.width / objetivo)
        arriba = (im.height - nuevo) // 2
        im = im.crop((0, arriba, im.width, arriba + nuevo))
    return im.resize((ancho, alto), Image.LANCZOS)


def a_i420(im):
    """RGB -> YUV 4:2:0 planar, que es lo que pide el formato Y4M."""
    a = np.asarray(im).astype(float)
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    y = 0.299 * r + 0.587 * g + 0.114 * b
    u = -0.169 * r - 0.331 * g + 0.5 * b + 128
    v = 0.5 * r - 0.419 * g - 0.081 * b + 128
    # Los planos de color van a la mitad de resolucion (de ahi el "4:2:0").
    u = u.reshape(ALTO // 2, 2, ANCHO // 2, 2).mean(axis=(1, 3))
    v = v.reshape(ALTO // 2, 2, ANCHO // 2, 2).mean(axis=(1, 3))
    return (
        np.clip(y, 0, 255).astype(np.uint8).tobytes()
        + np.clip(u, 0, 255).astype(np.uint8).tobytes()
        + np.clip(v, 0, 255).astype(np.uint8).tobytes()
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("salida")
    ap.add_argument("--foto", default=FOTO_POR_DEFECTO)
    args = ap.parse_args()

    cuadro = a_i420(encuadrar(bajar(args.foto), ANCHO, ALTO))
    with open(args.salida, "wb") as f:
        f.write(f"YUV4MPEG2 W{ANCHO} H{ALTO} F30:1 Ip A1:1 C420mpeg2\n".encode())
        for _ in range(CUADROS):
            f.write(b"FRAME\n")
            f.write(cuadro)

    import os
    print(f"{args.salida}: {os.path.getsize(args.salida)} bytes, {CUADROS} cuadros de {ANCHO}x{ALTO}")


if __name__ == "__main__":
    main()
