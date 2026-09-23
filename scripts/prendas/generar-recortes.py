# -*- coding: utf-8 -*-
"""Genera los recortes de prenda a partir de las fotos del catalogo.

  KIE_API_KEY=... python generar-recortes.py [--limite 23] [--api URL]

Cuesta 4 creditos por imagen. Saltea las que ya existen.

`--limite` es un tope sobre el TOTAL de recortes, no sobre los de esta
corrida: las que ya estan en `public/prendas/` cuentan. Antes contaba solo
las nuevas, asi que correrlo de nuevo con el mismo `--limite` empezaba de
cero y seguia gastando creditos (4 por imagen) por encima del tope que se
habia pedido.
"""
import argparse, json, os, sys, time, urllib.request
from io import BytesIO

from PIL import Image
from recorte import normalizar, quitar_croma

API = "https://mirroria.duckdns.org/api/v1"
SALIDA = os.path.join(os.path.dirname(__file__), "..", "..", "mirroria-frontend", "public", "prendas")
TRABAJO = os.path.join(os.path.dirname(__file__), ".trabajo")
CLAVE = os.environ.get("KIE_API_KEY")

PROMPT = (
    "Extract ONLY the garment worn by the person. Remove the person, the "
    "background and every other object completely. Also remove any hat, "
    "scarf, bag, jewelry or other accessory that is not the requested "
    "garment. Return the garment alone, flat front view like an e-commerce "
    "catalog cutout, centered and complete, keeping its real colors, fabric "
    "texture and pattern. Place it on a solid pure magenta (#FF00FF) "
    "background."
)
# Las prendas donde el probador se luce van primero: el presupuesto no alcanza
# para las 28 (4 creditos cada una, quedan 94).
PRIORIDAD = ["vestidos", "abrigos-y-blazers", "blusas-y-tops", "pantalones-y-faldas"]


def pedir(url, datos=None, cabeceras=None, espera=120):
    req = urllib.request.Request(url, data=datos, headers=cabeceras or {},
                                 method="POST" if datos else "GET")
    with urllib.request.urlopen(req, timeout=espera) as r:
        return r.read()


def aislar_prenda(url_foto):
    """Manda la foto al modelo y devuelve la imagen con la prenda sobre croma."""
    cuerpo = json.dumps({
        "model": "google/nano-banana-edit",
        "input": {"prompt": PROMPT, "image_urls": [url_foto],
                  "output_format": "png", "image_size": "auto"},
    }).encode()
    r = json.loads(pedir("https://api.kie.ai/api/v1/jobs/createTask", cuerpo,
                         {"Authorization": f"Bearer {CLAVE}", "Content-Type": "application/json"}))
    tarea = r["data"]["taskId"]
    for _ in range(40):
        d = json.loads(pedir(f"https://api.kie.ai/api/v1/jobs/recordInfo?taskId={tarea}",
                             None, {"Authorization": f"Bearer {CLAVE}"}))
        estado = d.get("data", {}).get("state")
        if estado == "success":
            url = json.loads(d["data"]["resultJson"])["resultUrls"][0]
            return Image.open(BytesIO(pedir(url, None, {"User-Agent": "Mozilla/5.0"})))
        if estado == "fail":
            raise RuntimeError(json.dumps(d)[:300])
        time.sleep(6)
    raise TimeoutError("el modelo no contesto a tiempo")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limite", type=int, default=23,
                    help="tope de recortes EN TOTAL, contando los que ya existen")
    ap.add_argument("--api", default=API)
    args = ap.parse_args()
    if not CLAVE:
        sys.exit("falta KIE_API_KEY en el entorno")

    os.makedirs(SALIDA, exist_ok=True)
    os.makedirs(TRABAJO, exist_ok=True)

    productos = json.loads(pedir(f"{args.api}/catalogo/productos"))
    categorias = {c["id"]: c["slug"] for c in json.loads(pedir(f"{args.api}/catalogo/categorias"))}
    productos.sort(key=lambda p: PRIORIDAD.index(categorias.get(p["categoriaId"], ""))
                   if categorias.get(p["categoriaId"], "") in PRIORIDAD else 99)

    # El tope es sobre el TOTAL: se arranca contando lo que ya hay en la
    # carpeta de salida, no en cero. Contar solo las nuevas convertia
    # `--limite` en "otras 23 mas por corrida", y cada una cuesta 4 creditos.
    total = len([f for f in os.listdir(SALIDA) if f.endswith(".png")])
    print(f"recortes que ya existen: {total} (tope total: {args.limite})")
    nuevos = 0
    for p in productos:
        destino = os.path.join(SALIDA, f"{p['slug']}.png")
        if os.path.exists(destino):
            print(f"  = {p['slug']} (ya estaba)")
            continue
        if total >= args.limite:
            print(f"  . {p['slug']} (fuera del tope total de {args.limite})")
            continue
        foto = (p.get("imagenes") or [{}])[0].get("url")
        if not foto:
            print(f"  ! {p['slug']} sin foto")
            continue
        try:
            croma = aislar_prenda(foto)
            croma.save(os.path.join(TRABAJO, f"{p['slug']}-croma.png"))
            normalizar(quitar_croma(croma)).save(destino)
            total += 1
            nuevos += 1
            print(f"  + {p['slug']} ({total}/{args.limite})")
        except Exception as e:
            print(f"  ! {p['slug']}: {str(e)[:120]}")

    # Hoja de contacto para MIRAR el resultado, sobre un fondo a cuadros que
    # deja ver los bordes y cualquier resto de fondo.
    print(f"recortes nuevos en esta corrida: {nuevos} ({nuevos * 4} creditos)")
    archivos = sorted(f for f in os.listdir(SALIDA) if f.endswith(".png"))
    if archivos:
        celda, cols = 260, 6
        filas = (len(archivos) + cols - 1) // cols
        hoja = Image.new("RGB", (cols * celda, filas * celda), "white")
        for i in range(0, cols * celda, 20):
            for j in range(0, filas * celda, 20):
                if (i // 20 + j // 20) % 2 == 0:
                    hoja.paste((225, 225, 225), (i, j, min(i + 20, hoja.width), min(j + 20, hoja.height)))
        for n, nombre in enumerate(archivos):
            im = Image.open(os.path.join(SALIDA, nombre)).convert("RGBA")
            im.thumbnail((celda - 10, celda - 10))
            hoja.paste(im, ((n % cols) * celda + 5, (n // cols) * celda + 5), im)
        hoja.save(os.path.join(TRABAJO, "hoja-contacto.png"))
        print(f"\nhoja de contacto: {os.path.join(TRABAJO, 'hoja-contacto.png')} ({len(archivos)} prendas)")


if __name__ == "__main__":
    main()
