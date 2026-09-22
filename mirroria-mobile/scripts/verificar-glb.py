"""Verifica un .glb contra lo que el Vestidor 3D de MirrorIA realmente exige.

Uso:  python verificar-glb.py modelo.glb [otro.glb ...]

Los limites salen del codigo, no de la ficha de Sketchfab:
  - GarmentModel.tsx usa GLTFLoader().parse() sin DRACOLoader  -> Draco rompe.
  - Solo toma gltf.scene y le aplica transform al group        -> huesos/animacion no sirven.
  - measureShoulderCrossSection mide el ancho al 8% desde arriba -> cabeza/percha rompe el anclaje.
  - Ese metodo recorre CADA vertice en JS al cargar            -> el costo es por vertice.
  - Los modelos entran por require() -> van dentro del APK     -> el peso importa.
"""
import json, struct, sys, os

# Medidos sobre los dos modelos que YA funcionan (black_dress, waist_trainer)
TRIS_OK, TRIS_MAX = 40_000, 80_000
MB_OK, MB_MAX = 1.5, 4.0
SHOULDER_FRACTION_FROM_TOP = 0.08   # igual que GarmentModel.tsx
BAND = 0.03

def leer(p):
    d = open(p, 'rb').read()
    if d[:4] != b'glTF':
        raise ValueError('no es un .glb binario (quiza es .gltf de texto)')
    off, js, bin_ = 12, None, b''
    while off < len(d):
        ln, ty = struct.unpack_from('<II', d, off)
        ch = d[off+8:off+8+ln]
        if ty == 0x4E4F534A: js = json.loads(ch.decode('utf-8'))
        elif ty == 0x004E4942: bin_ = ch
        off += 8 + ln
    return js, bin_

def mat_mul(a, b):
    return [sum(a[i+k*4]*b[k+j*4] for k in range(4)) for j in range(4) for i in range(4)]

def trs(n):
    if 'matrix' in n: return list(n['matrix'])
    t = n.get('translation', [0,0,0]); r = n.get('rotation', [0,0,0,1]); s = n.get('scale', [1,1,1])
    x,y,z,w = r
    m = [1-2*(y*y+z*z), 2*(x*y+z*w), 2*(x*z-y*w), 0,
         2*(x*y-z*w), 1-2*(x*x+z*z), 2*(y*z+x*w), 0,
         2*(x*z+y*w), 2*(y*z-x*w), 1-2*(x*x+y*y), 0,
         0,0,0,1]
    for c in range(3):
        for f in range(3): m[c*4+f] *= s[c]
    m[12], m[13], m[14] = t
    return m

def vertices_mundo(js, bin_):
    """Devuelve los POSITION de todas las mallas, ya con la transformacion de su nodo."""
    acc, bvs = js.get('accessors', []), js.get('bufferViews', [])
    salida = []
    def recorrer(idx, padre):
        n = js['nodes'][idx]
        m = mat_mul(padre, trs(n))
        if 'mesh' in n:
            for pr in js['meshes'][n['mesh']]['primitives']:
                a = pr.get('attributes', {}).get('POSITION')
                if a is None: continue
                a = acc[a]; bv = bvs[a['bufferView']]
                base = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
                stride = bv.get('byteStride') or 12
                for i in range(a['count']):
                    x, y, z = struct.unpack_from('<3f', bin_, base + i*stride)
                    salida.append((m[0]*x+m[4]*y+m[8]*z+m[12],
                                   m[1]*x+m[5]*y+m[9]*z+m[13],
                                   m[2]*x+m[6]*y+m[10]*z+m[14]))
        for h in n.get('children', []): recorrer(h, m)
    ident = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]
    for esc in js.get('scenes', []):
        for r in esc.get('nodes', []): recorrer(r, ident)
    return salida

def verificar(p):
    print(f"\n=== {os.path.basename(p)} ===")
    fallas, avisos = [], []
    try:
        js, bin_ = leer(p)
    except Exception as e:
        print(f"  RECHAZADO: {e}"); return False

    mb = os.path.getsize(p) / 1048576
    acc = js.get('accessors', [])
    verts = tris = 0
    for m in js.get('meshes', []):
        for pr in m.get('primitives', []):
            a = pr.get('attributes', {}).get('POSITION')
            if a is not None: verts += acc[a]['count']
            if 'indices' in pr: tris += acc[pr['indices']]['count'] // 3

    ext = js.get('extensionsUsed', [])
    if any('draco' in e.lower() for e in ext): fallas.append(f"usa DRACO ({ext}) -> GLTFLoader.parse() sin DRACOLoader no lo abre")
    if js.get('skins'):       fallas.append(f"tiene {len(js['skins'])} skin/esqueleto -> el codigo solo mueve el group, no anima huesos")
    if js.get('animations'):  fallas.append(f"tiene {len(js['animations'])} animacion(es) -> no se reproducen, suelen dejar la malla en pose T")

    if tris > TRIS_MAX:   fallas.append(f"{tris:,} triangulos (> {TRIS_MAX:,})")
    elif tris > TRIS_OK:  avisos.append(f"{tris:,} triangulos: anda, pero por encima de los que ya estan probados (<= {TRIS_OK:,})")
    if mb > MB_MAX:       fallas.append(f"{mb:.2f} MB (> {MB_MAX} MB) -> va dentro del APK")
    elif mb > MB_OK:      avisos.append(f"{mb:.2f} MB: entra, pero engorda el APK (el que anda pesa 1,0 MB)")

    # --- el chequeo que de verdad importa: hay hombros al 8% de arriba?
    try:
        vs = vertices_mundo(js, bin_)
    except Exception as e:
        avisos.append(f"no se pudo medir la geometria ({e}); revisar a ojo en Blender"); vs = []

    if vs:
        ys = [v[1] for v in vs]; xs = [v[0] for v in vs]; zs = [v[2] for v in vs]
        alto, ancho, fondo = max(ys)-min(ys), max(xs)-min(xs), max(zs)-min(zs)
        top = max(ys)

        def ancho_en(frac):
            objetivo = top - alto*frac
            banda = [v[0] for v in vs if abs(v[1]-objetivo) <= alto*BAND]
            return (max(banda)-min(banda)) if banda else 0.0

        w_hombro = ancho_en(SHOULDER_FRACTION_FROM_TOP)
        # En una prenda SIN cabeza los hombros estan arriba de todo: el ancho
        # es plano del 2% al 10%. Con cabeza/percha, el 8% cae en el cuello y
        # el ancho recien crece al 15-25%. Calibrado sobre black_dress y
        # waist_trainer, que dan razon ~1.00.
        w_max_arriba = max(ancho_en(f) for f in (0.02, 0.04, 0.06, 0.08, 0.12, 0.16, 0.20, 0.25))
        razon = w_hombro / w_max_arriba if w_max_arriba else 0
        print(f"  bbox: alto {alto:.3f} / ancho {ancho:.3f} / fondo {fondo:.3f}")
        print(f"  ancho al 8% desde arriba: {w_hombro:.3f}  =  {razon:.0%} del maximo del cuarto superior")
        if w_hombro == 0:
            fallas.append("no hay geometria al 8% desde arriba -> el anclaje de hombros no mide nada")
        elif razon < 0.70:
            fallas.append(f"al 8% hay solo el {razon:.0%} del ancho del cuarto superior -> arriba de los hombros hay CABEZA, CUELLO o PERCHA: la prenda se anclara mal")
        elif razon < 0.85:
            avisos.append(f"al 8% hay el {razon:.0%} del ancho del cuarto superior -> puede haber tirantes o cuello alto; recalibrar SHOULDER_FRACTION_FROM_TOP a ojo")
        if alto < ancho:
            avisos.append("mas ancho que alto -> Y no parece el eje vertical; confirmar que esta de pie con Y arriba")
        if fondo > ancho * 1.3:
            avisos.append("mas profundo que ancho -> quiza esta acostado o de perfil, no de frente")

    print(f"  {verts:,} vertices | {tris:,} triangulos | {len(js.get('textures',[]))} texturas | {mb:.2f} MB")
    for f in fallas: print(f"  [X] {f}")
    for a in avisos: print(f"  [!] {a}")
    if not fallas: print("  [OK] SIRVE" + (" (con avisos)" if avisos else ""))
    return not fallas

if __name__ == '__main__':
    if len(sys.argv) < 2: print(__doc__); sys.exit(2)
    ok = all([verificar(p) for p in sys.argv[1:]])
    sys.exit(0 if ok else 1)
