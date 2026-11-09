# /// script
# requires-python = ">=3.11"
# dependencies = ["qrcode[pil]==8.2", "python-barcode==0.15.1", "pillow==11.3.0"]
# ///
"""Etiquetas de prenda para probar el escáner de la app móvil (M4.1, spec D10).

Baja las variantes REALES de una tienda (`GET /catalogo/productos?conVariantes=true`, público con
X-Tenant: el mismo catálogo que copia la app a SQLite) y genera, por variante, una etiqueta PNG
con el QR (`mirroria:v:<SKU>`), el Code128 del SKU y el texto impreso. También arma una hoja
`index.html` para abrir en la pantalla de la laptop y escanearla con el celular, como si fueran
las etiquetas colgadas en la tienda. No escribe nada en la BD.

    uv run scripts/qa/etiquetas_qr.py                          # tiendaria, todas las variantes
    uv run scripts/qa/etiquetas_qr.py --tienda nomada --solo-agotadas
    API=http://localhost:3000/api/v1 uv run scripts/qa/etiquetas_qr.py --salida /tmp/etiquetas
    # Windows: explorer.exe "$(wslpath -w scripts/qa/etiquetas/tiendaria/index.html)"
"""
import argparse
import base64
import html
import io
import json
import os
import pathlib
import urllib.request

import barcode
import qrcode
from barcode.writer import ImageWriter
from PIL import Image, ImageDraw, ImageFont

API = os.environ.get("API", "http://localhost:3000/api/v1")
AQUI = pathlib.Path(__file__).resolve().parent


def get(ruta: str, tienda: str):
    req = urllib.request.Request(f"{API}{ruta}", headers={"X-Tenant": tienda})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.load(r)


def stock_por_variante(tienda: str) -> dict[str, int]:
    libre: dict[str, int] = {}
    for i in get("/inventario", tienda):
        v = i["varianteId"]
        libre[v] = libre.get(v, 0) + max(0, i["cantidadDisponible"] - i["cantidadReservada"])
    return libre


def fuente(tam: int):
    for f in ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf"):
        if os.path.exists(f):
            return ImageFont.truetype(f, tam)
    return ImageFont.load_default()


def etiqueta(prenda: str, v: dict, precio_cents: int, libre: int) -> Image.Image:
    """Etiqueta 600x900: QR grande arriba (lo que lee la app), Code128 abajo y el texto legible."""
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=12, border=3)
    qr.add_data(f"mirroria:v:{v['sku']}")
    img_qr = qr.make_image(fill_color="black", back_color="white").convert("RGB").resize((460, 460))
    buf = io.BytesIO()
    barcode.get("code128", v["sku"], writer=ImageWriter()).write(buf, {"module_height": 12, "write_text": False, "quiet_zone": 3})
    img_bc = Image.open(io.BytesIO(buf.getvalue())).convert("RGB")
    img_bc = img_bc.resize((480, int(img_bc.height * 480 / img_bc.width)))

    lienzo = Image.new("RGB", (600, 900), "white")
    d = ImageDraw.Draw(lienzo)
    d.rectangle([6, 6, 593, 893], outline="black", width=3)
    d.text((300, 40), prenda[:32], fill="black", font=fuente(30), anchor="mm")
    d.text((300, 80), f"Talla {v['tallaNombre']} · {v['colorNombre']} · Bs {precio_cents / 100:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."), fill="#333", font=fuente(22), anchor="mm")
    lienzo.paste(img_qr, (70, 110))
    lienzo.paste(img_bc, (60, 590))
    d.text((300, 590 + img_bc.height + 30), v["sku"], fill="black", font=fuente(34), anchor="mm")
    d.text((300, 860), "AGOTADA en la vitrina" if libre <= 0 else f"{libre} libres", fill="#b00" if libre <= 0 else "#666", font=fuente(20), anchor="mm")
    return lienzo


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--tienda", default=os.environ.get("TENANT", "tiendaria"))
    ap.add_argument("--salida", default=None, help="carpeta (default scripts/qa/etiquetas/<tienda>)")
    ap.add_argument("--solo-agotadas", action="store_true", help="solo variantes sin stock libre (para probar 'Avisame')")
    ap.add_argument("--max", type=int, default=60)
    a = ap.parse_args()

    salida = pathlib.Path(a.salida or AQUI / "etiquetas" / a.tienda)
    salida.mkdir(parents=True, exist_ok=True)
    productos = get("/catalogo/productos?conVariantes=true", a.tienda)
    libre = stock_por_variante(a.tienda)

    tarjetas, n = [], 0
    for p in sorted(productos, key=lambda x: x["titulo"]):
        if not p.get("activo"):
            continue
        for v in p.get("variantes") or []:
            if not v.get("activo") or (a.solo_agotadas and libre.get(v["id"], 0) > 0) or n >= a.max:
                continue
            img = etiqueta(p["titulo"], v, p["precioCents"], libre.get(v["id"], 0))
            img.save(salida / f"{v['sku']}.png")
            b = io.BytesIO()
            img.save(b, "PNG")
            tarjetas.append(
                f'<figure><img alt="{html.escape(v["sku"])}" src="data:image/png;base64,{base64.b64encode(b.getvalue()).decode()}"></figure>'
            )
            n += 1

    (salida / "index.html").write_text(
        f"""<!doctype html><html lang="es"><meta charset="utf-8"><title>Etiquetas {html.escape(a.tienda)}</title>
<style>body{{font-family:system-ui;margin:24px;background:#f4f4f5}}h1{{font-size:20px}}
main{{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px}}
figure{{margin:0;background:#fff;padding:8px;border-radius:8px}}img{{width:100%;display:block}}</style>
<h1>Etiquetas de {html.escape(a.tienda)} ({n}) · app MirrorIA → Vitrina → Escanear</h1><main>{''.join(tarjetas)}</main></html>""",
        encoding="utf-8",
    )
    print(f"{n} etiquetas en {salida} (abrí index.html en la laptop)")


if __name__ == "__main__":
    main()
