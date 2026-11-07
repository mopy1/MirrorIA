#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Compilador Académico de Documentación MirrorIA — Parcial 2 (SI2)
Genera:
  1. PDF de alta fidelidad vía WeasyPrint con estilos tipográficos de publicación.
  2. DOCX (Word) editable vía python-docx con tablas nativas, diagramas e índice.
"""

import os
import re
import sys
import markdown
import weasyprint
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.join(SCRIPT_DIR, "base")
DIR_PNG = os.path.join(BASE_DIR, "diagramas_png")
OUTPUT_DOCX = os.path.join(SCRIPT_DIR, "Documento_Final_MirrorIA_SI2.docx")
OUTPUT_PDF = os.path.join(SCRIPT_DIR, "Documento_Final_MirrorIA_SI2.pdf")

CHAPTER_FILES = [
    ("Capítulo I: Aspectos Generales", os.path.join(BASE_DIR, "01_Aspectos_Generales/01_Aspectos_Generales.md")),
    ("Capítulo II: Análisis de Requisitos", os.path.join(BASE_DIR, "02_Analisis_de_Requisitos/02_Analisis_de_Requisitos.md")),
    ("Capítulo III: Análisis y Diseño Orientado a Objetos (ICONIX)", os.path.join(BASE_DIR, "03_Analisis_y_Diseno_ICONIX/03_Analisis_y_Diseno_ICONIX.md")),
    ("Capítulo IV: Desarrollo e Implementación", os.path.join(BASE_DIR, "04_Desarrollo_e_Implementacion/04_Desarrollo_e_Implementacion.md")),
    ("Capítulo V: Pruebas y Resultados", os.path.join(BASE_DIR, "05_Pruebas_y_Resultados/05_Pruebas_y_Resultados.md")),
    ("Capítulo VI: Conclusiones y Recomendaciones", os.path.join(BASE_DIR, "06_Conclusiones_y_Recomendaciones/06_Conclusiones_y_Recomendaciones.md")),
    ("Capítulo VII: Bibliografía y Anexos", os.path.join(BASE_DIR, "07_Bibliografia_y_Anexos/07_Bibliografia_y_Anexos.md")),
]

def clean_obsidian_callouts(text):
    """Convierte callouts de Obsidian (> [!NOTE]) a HTML estructurado."""
    def repl(m):
        ctype = m.group(1).upper()
        title = m.group(2).strip() if m.group(2).strip() else ctype.capitalize()
        content = m.group(3)
        clean_lines = [re.sub(r"^>\s?", "", line) for line in content.split("\n")]
        clean_content = "\n".join(clean_lines).strip()
        icon_map = {
            "NOTE": "ℹ️",
            "TIP": "💡",
            "IMPORTANT": "📌",
            "WARNING": "⚠️",
            "CAUTION": "🛑"
        }
        icon = icon_map.get(ctype, "📌")
        return (
            f'\n<div class="callout callout-{ctype.lower()}">\n'
            f'  <div class="callout-header"><span class="callout-icon">{icon}</span> <strong>{title}</strong></div>\n'
            f'  <div class="callout-body">\n\n{clean_content}\n\n</div>\n'
            f'</div>\n'
        )
    pattern = r">\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]([^\n]*)\n((?:>[^\n]*\n?)*)"
    return re.sub(pattern, repl, text, flags=re.IGNORECASE)

def process_chapter_markdown(ch_idx, title, filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        raw = f.read()

    # 1. Eliminar Frontmatter YAML al inicio
    raw = re.sub(r"^---\n.*?\n---\n+", "", raw, flags=re.DOTALL)

    # 2. Omitir bloques de código mermaid para el HTML/PDF (ya que se usan las imágenes PNG)
    raw = re.sub(r"```mermaid\n.*?```", "", raw, flags=re.DOTALL)

    # 3. Convertir rutas relativas de imágenes markdown a figuras HTML con absolute URI
    def img_repl(m):
        alt = m.group(1)
        rel_path = m.group(2)
        filename = os.path.basename(rel_path)
        abs_img_path = os.path.join(DIR_PNG, filename)
        return (
            f'\n\n<figure class="diagram-figure">\n'
            f'  <img src="file://{abs_img_path}" alt="{alt}" class="diagram-img" />\n'
            f'  <figcaption>{alt}</figcaption>\n'
            f'</figure>\n\n'
        )
    raw = re.sub(r"!\[(.*?)\]\((.*?\.png)\)", img_repl, raw)

    # 4. Convertir callouts
    raw = clean_obsidian_callouts(raw)

    return raw

CSS_STYLING = """
@page {
    size: letter;
    margin: 22mm 18mm 22mm 18mm;
    @top-right {
        content: "MirrorIA — Documentación Parcial 2 (SI2)";
        font-family: 'Liberation Sans', 'DejaVu Sans', Arial, sans-serif;
        font-size: 8pt;
        color: #64748b;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 4px;
    }
    @bottom-center {
        content: "Página " counter(page) " de " counter(pages);
        font-family: 'Liberation Sans', 'DejaVu Sans', Arial, sans-serif;
        font-size: 8pt;
        color: #64748b;
        border-top: 1px solid #e2e8f0;
        padding-top: 4px;
    }
}

@page :first {
    margin: 0;
    @top-right { content: normal; }
    @bottom-center { content: normal; }
}

body {
    font-family: 'Liberation Sans', 'DejaVu Sans', Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.5;
    color: #0f172a;
    text-align: justify;
    hyphens: auto;
}

/* PORTADA */
.cover-page {
    page-break-after: always;
    height: 100vh;
    padding: 60px 45px 40px 45px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: #ffffff;
    border-top: 8px solid #1e3a8a;
}
.cover-header {
    text-align: center;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 20px;
}
.cover-header h2 {
    font-size: 13pt;
    font-weight: 800;
    color: #1e3a8a;
    margin: 0 0 6px 0;
    letter-spacing: 0.5px;
}
.cover-header h3 {
    font-size: 11pt;
    font-weight: 700;
    color: #334155;
    margin: 0 0 4px 0;
}
.cover-header h4 {
    font-size: 9.5pt;
    font-weight: 600;
    color: #64748b;
    margin: 0;
}
.cover-main {
    text-align: center;
    margin: 40px 0;
}
.cover-materia {
    font-size: 10pt;
    font-weight: 700;
    color: #2563eb;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 15px;
}
.cover-title {
    font-size: 26pt;
    font-weight: 900;
    color: #0f172a;
    margin: 0 0 10px 0;
    letter-spacing: 1px;
}
.cover-subtitle {
    font-size: 12pt;
    font-weight: 700;
    color: #1e3a8a;
    margin: 0 0 20px 0;
    line-height: 1.4;
}
.cover-desc {
    font-size: 9pt;
    color: #475569;
    line-height: 1.5;
    max-width: 600px;
    margin: 0 auto;
}
.cover-meta {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #1e3a8a;
    padding: 16px 20px;
    border-radius: 4px;
}
.cover-meta table {
    width: 100%;
    border-collapse: collapse;
}
.cover-meta td {
    padding: 4px 8px;
    font-size: 9pt;
    border: none;
}
.cover-meta td:first-child {
    font-weight: 700;
    color: #1e293b;
    width: 25%;
}
.cover-meta td:last-child {
    color: #334155;
}
.cover-footer {
    text-align: center;
    font-size: 8.5pt;
    color: #94a3b8;
    margin-top: 20px;
}

/* ENCABEZADOS */
h1 {
    font-size: 18pt;
    font-weight: 800;
    color: #1e3a8a;
    border-bottom: 2px solid #1e3a8a;
    padding-bottom: 6px;
    margin-top: 28px;
    margin-bottom: 16px;
    page-break-after: avoid;
}
.chapter-break {
    page-break-before: always;
}
h2 {
    font-size: 13.5pt;
    font-weight: 700;
    color: #1e293b;
    margin-top: 22px;
    margin-bottom: 10px;
    page-break-after: avoid;
    border-left: 4px solid #2563eb;
    padding-left: 8px;
}
h3 {
    font-size: 11pt;
    font-weight: 700;
    color: #334155;
    margin-top: 16px;
    margin-bottom: 8px;
    page-break-after: avoid;
}
h4 {
    font-size: 10pt;
    font-weight: 700;
    color: #475569;
    margin-top: 12px;
    margin-bottom: 6px;
    page-break-after: avoid;
}

/* PÁRRAFOS Y LISTAS */
p {
    margin: 0 0 10px 0;
}
ul, ol {
    margin: 0 0 12px 0;
    padding-left: 24px;
}
li {
    margin-bottom: 4px;
}

/* TABLAS */
table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 8.5pt;
    page-break-inside: avoid;
}
th {
    background-color: #1e3a8a;
    color: #ffffff;
    font-weight: 700;
    text-align: left;
    padding: 7px 9px;
    border: 1px solid #1e3a8a;
}
td {
    padding: 6px 9px;
    border: 1px solid #cbd5e1;
    vertical-align: top;
}
tr:nth-child(even) td {
    background-color: #f8fafc;
}

/* CÓDIGO */
pre {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 10px 14px;
    font-family: 'Courier New', Courier, monospace;
    font-size: 8pt;
    line-height: 1.4;
    overflow-wrap: break-word;
    white-space: pre-wrap;
    margin: 12px 0;
    page-break-inside: avoid;
}
code {
    font-family: 'Courier New', Courier, monospace;
    font-size: 8.5pt;
    background-color: #f1f5f9;
    color: #0f172a;
    padding: 1px 4px;
    border-radius: 3px;
    border: 1px solid #e2e8f0;
}
pre code {
    background-color: transparent;
    padding: 0;
    border: none;
}

/* DIAGRAMAS / IMÁGENES */
.diagram-figure {
    text-align: center;
    margin: 18px 0;
    page-break-inside: avoid;
}
.diagram-img {
    max-width: 95%;
    max-height: 480px;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.06);
}
figcaption {
    font-size: 8pt;
    font-style: italic;
    color: #64748b;
    margin-top: 6px;
    text-align: center;
}

/* CALLOUTS */
.callout {
    margin: 14px 0;
    padding: 10px 14px;
    border-radius: 4px;
    page-break-inside: avoid;
    font-size: 9pt;
}
.callout-note {
    background-color: #eff6ff;
    border-left: 4px solid #2563eb;
    color: #1e3a8a;
}
.callout-tip {
    background-color: #f0fdf4;
    border-left: 4px solid #16a34a;
    color: #14532d;
}
.callout-warning {
    background-color: #fffbeb;
    border-left: 4px solid #d97706;
    color: #78350f;
}
.callout-important {
    background-color: #fdf2f8;
    border-left: 4px solid #db2777;
    color: #831843;
}
.callout-header {
    font-weight: 700;
    margin-bottom: 4px;
    font-size: 9pt;
}
.callout-body p:last-child {
    margin-bottom: 0;
}

/* ÍNDICE */
.toc-box {
    page-break-after: always;
    padding: 20px 0;
}
.toc-box h1 {
    text-align: center;
    border-bottom: 2px solid #1e3a8a;
    padding-bottom: 10px;
}
.toc-list {
    list-style-type: none;
    padding: 0;
    margin: 20px 0;
}
.toc-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 10pt;
    border-bottom: 1px dotted #cbd5e1;
    padding-bottom: 4px;
}
.toc-item a {
    text-decoration: none;
    color: #1e293b;
    font-weight: 700;
}
"""

def generate_pdf():
    print("Compilando capítulos a HTML...")
    chapters_html = []

    for ch_idx, (title, filepath) in enumerate(CHAPTER_FILES):
        print(f"  -> Procesando {title}...")
        processed_md = process_chapter_markdown(ch_idx, title, filepath)
        ch_html = markdown.markdown(processed_md, extensions=['tables', 'fenced_code', 'toc'])
        chapters_html.append(f'<div class="chapter-container chapter-break">\n{ch_html}\n</div>')

    full_body = "\n".join(chapters_html)

    html_content = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>MirrorIA — Documento de Especificación y Diseño ICONIX</title>
<style>
{CSS_STYLING}
</style>
</head>
<body>

<!-- PORTADA -->
<div class="cover-page">
    <div class="cover-header">
        <h2>UNIVERSIDAD AUTÓNOMA GABRIEL RENÉ MORENO</h2>
        <h3>FACULTAD DE CIENCIAS DE LA COMPUTACIÓN Y TELECOMUNICACIONES</h3>
        <h4>CARRERA DE INGENIERÍA EN SISTEMAS / INGENIERÍA INFORMÁTICA</h4>
    </div>

    <div class="cover-main">
        <div class="cover-materia">Sistemas de Información II (INF-412) — Semestre 2-2026</div>
        <h1 class="cover-title">MIRROR-IA</h1>
        <div class="cover-subtitle">Plataforma SaaS Multi-tenant de Comercio Omnicanal y Probador Virtual Inteligente para Boutiques de Moda Femenina</div>
        <p class="cover-desc">
            Documento Académico Exhaustivo de Especificación de Requisitos, Análisis y Diseño Arquitectónico Orientado a Objetos (ICONIX Process & UML 2.5), Resiliencia Transaccional Offline-First (Web PWA + Móvil Expo) y Machine Learning Supervisado / No Supervisado con Fallback Heurístico.
        </p>
    </div>

    <div class="cover-meta">
        <table>
            <tr><td>Docente Guía:</td><td>MSc. Angélica Garzón Cuellar</td></tr>
            <tr><td>Asignatura:</td><td>Sistemas de Información II (INF-412) — Grupo SA</td></tr>
            <tr><td>Evaluación:</td><td>Proyecto de Examen Parcial 2 (Proceso ICONIX, UML 2.5 e Implementación)</td></tr>
            <tr><td>Boutique Piloto:</td><td>Tiendaria (Slug: <code>tiendaria</code>) — Catálogo y Datos Reales</td></tr>
            <tr><td>Gestión:</td><td>Semestre 2-2026</td></tr>
            <tr><td>Ubicación:</td><td>Santa Cruz de la Sierra, Bolivia — Noviembre 2026</td></tr>
        </table>
    </div>

    <div class="cover-footer">
        Facultad de Ciencias de la Computación y Telecomunicaciones (FICCT) — UAGRM
    </div>
</div>

<!-- ÍNDICE GENERAL -->
<div class="toc-box">
    <h1>ÍNDICE GENERAL DE CONTENIDOS</h1>
    <div class="toc-list">
        <div class="toc-item"><span>Capítulo I: Aspectos Generales</span></div>
        <div class="toc-item"><span>Capítulo II: Análisis de Requisitos y Modelado de Casos de Uso</span></div>
        <div class="toc-item"><span>Capítulo III: Análisis y Diseño Orientado a Objetos (ICONIX)</span></div>
        <div class="toc-item"><span>Capítulo IV: Desarrollo e Implementación Técnica</span></div>
        <div class="toc-item"><span>Capítulo V: Pruebas y Resultados de Validación</span></div>
        <div class="toc-item"><span>Capítulo VI: Conclusiones y Recomendaciones</span></div>
        <div class="toc-item"><span>Capítulo VII: Bibliografía y Anexos</span></div>
    </div>
</div>

<!-- CAPÍTULOS -->
{full_body}

</body>
</html>
"""

    print("Renderizando PDF con WeasyPrint...")
    weasyprint.HTML(string=html_content, base_url=BASE_DIR).write_pdf(OUTPUT_PDF)
    print(f"PDF generado con éxito en: {OUTPUT_PDF} ({os.path.getsize(OUTPUT_PDF)} bytes)")


def generate_docx():
    print("\nGenerando documento Word (.docx) con python-docx...")
    doc = docx.Document()

    # Configuración de márgenes estándar (2.2 cm)
    for section in doc.sections:
        section.top_margin = Inches(0.85)
        section.bottom_margin = Inches(0.85)
        section.left_margin = Inches(0.85)
        section.right_margin = Inches(0.85)

    # Estilos base
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = RGBColor(15, 23, 42)

    # PORTADA DOCX
    p_univ = doc.add_paragraph()
    p_univ.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_u = p_univ.add_run("UNIVERSIDAD AUTÓNOMA GABRIEL RENÉ MORENO\nFACULTAD DE CIENCIAS DE LA COMPUTACIÓN Y TELECOMUNICACIONES\nCARRERA DE INGENIERÍA EN SISTEMAS")
    run_u.bold = True
    run_u.font.size = Pt(12)
    run_u.font.color.rgb = RGBColor(30, 58, 138)

    doc.add_paragraph()

    p_mat = doc.add_paragraph()
    p_mat.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_m = p_mat.add_run("SISTEMAS DE INFORMACIÓN II (INF-412) — SEMESTRE 2-2026")
    run_m.bold = True
    run_m.font.size = Pt(11)
    run_m.font.color.rgb = RGBColor(37, 99, 235)

    p_tit = doc.add_paragraph()
    p_tit.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_t = p_tit.add_run("MIRROR-IA\n")
    run_t.bold = True
    run_t.font.size = Pt(26)
    run_t.font.color.rgb = RGBColor(15, 23, 42)

    run_sub = p_tit.add_run("Plataforma SaaS Multi-tenant de Comercio Omnicanal y Probador Virtual Inteligente para Boutiques de Moda Femenina\n")
    run_sub.bold = True
    run_sub.font.size = Pt(13)
    run_sub.font.color.rgb = RGBColor(30, 58, 138)

    doc.add_paragraph()

    # Tabla de metadatos de portada
    meta_table = doc.add_table(rows=6, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        ("Docente Guía:", "MSc. Angélica Garzón Cuellar"),
        ("Asignatura:", "Sistemas de Información II (INF-412) — Grupo SA"),
        ("Modalidad:", "Proyecto de Examen Parcial 2 (ICONIX Process & UML 2.5)"),
        ("Boutique Piloto:", "Tiendaria (Slug: tiendaria) — Catálogo y Datos Reales"),
        ("Gestión:", "Semestre 2-2026"),
        ("Ubicación y Fecha:", "Santa Cruz de la Sierra, Bolivia — Noviembre 2026")
    ]
    for row_idx, (label, val) in enumerate(meta_data):
        row = meta_table.rows[row_idx]
        cell_lbl, cell_val = row.cells[0], row.cells[1]
        cell_lbl.width = Inches(2.2)
        cell_val.width = Inches(4.5)
        p_l = cell_lbl.paragraphs[0]
        r_l = p_l.add_run(label)
        r_l.bold = True
        r_l.font.size = Pt(9.5)
        p_v = cell_val.paragraphs[0]
        r_v = p_v.add_run(val)
        r_v.font.size = Pt(9.5)

    doc.add_page_break()

    # ÍNDICE GENERAL EN DOCX
    p_toc_head = doc.add_heading("ÍNDICE GENERAL DE CONTENIDOS", level=1)
    p_toc_head.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for ch_title, _ in CHAPTER_FILES:
        p_ti = doc.add_paragraph(style='List Bullet')
        r_ti = p_ti.add_run(ch_title)
        r_ti.bold = True

    doc.add_page_break()

    # PARSEO DE CAPÍTULOS A DOCX
    for ch_idx, (title, filepath) in enumerate(CHAPTER_FILES):
        print(f"  -> Añadiendo al Word {title}...")
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        # Eliminar Frontmatter YAML
        content = re.sub(r"^---\n.*?\n---\n+", "", content, flags=re.DOTALL)
        lines = content.splitlines(keepends=True)

        if ch_idx > 0:
            doc.add_page_break()

        in_code_block = False
        code_buffer = []
        code_lang = ""
        in_table = False
        table_buffer = []

        i = 0
        while i < len(lines):
            line = lines[i]
            sline = line.strip()

            # Manejo de bloques de código y mermaid
            if sline.startswith("```"):
                if not in_code_block:
                    in_code_block = True
                    code_lang = sline[3:].strip()
                    code_buffer = []
                    i += 1
                    continue
                else:
                    in_code_block = False
                    # Omitir código mermaid en Word (ya que se insertan las imágenes PNG)
                    if code_lang == "mermaid":
                        pass
                    else:
                        # Bloque de código normal
                        p_code = doc.add_paragraph()
                        p_code.paragraph_format.space_before = Pt(6)
                        p_code.paragraph_format.space_after = Pt(6)
                        p_code.paragraph_format.left_indent = Inches(0.3)
                        r_c = p_code.add_run("\n".join(code_buffer))
                        r_c.font.name = 'Consolas'
                        r_c.font.size = Pt(8.5)
                        r_c.font.color.rgb = RGBColor(30, 41, 59)
                    i += 1
                    continue

            if in_code_block:
                code_buffer.append(line.rstrip())
                i += 1
                continue

            # Manejo de imágenes markdown: ![caption](rel_path)
            img_match = re.match(r"^!\[(.*?)\]\((.*?\.png)\)$", sline)
            if img_match:
                caption = img_match.group(1)
                rel_path = img_match.group(2)
                filename = os.path.basename(rel_path)
                abs_img_path = os.path.join(DIR_PNG, filename)
                if os.path.exists(abs_img_path):
                    p_img = doc.add_paragraph()
                    p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    p_img.paragraph_format.space_before = Pt(12)
                    p_img.paragraph_format.space_after = Pt(4)
                    run_img = p_img.add_run()
                    run_img.add_picture(abs_img_path, width=Inches(6.0))
                    p_cap = doc.add_paragraph()
                    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    p_cap.paragraph_format.space_after = Pt(12)
                    r_cap = p_cap.add_run(caption)
                    r_cap.italic = True
                    r_cap.font.size = Pt(8.5)
                    r_cap.font.color.rgb = RGBColor(100, 116, 139)
                i += 1
                continue

            # Manejo de tablas markdown
            if sline.startswith("|") and sline.endswith("|"):
                if not in_table:
                    in_table = True
                    table_buffer = [line]
                else:
                    table_buffer.append(line)
                i += 1
                continue
            else:
                if in_table:
                    in_table = False
                    render_markdown_table_to_docx(doc, table_buffer)
                    table_buffer = []

            # Encabezados markdown
            if sline.startswith("# ") and not sline.startswith("## "):
                h = doc.add_heading(sline[2:].strip(), level=1)
                h.paragraph_format.space_before = Pt(18)
                h.paragraph_format.space_after = Pt(8)
            elif sline.startswith("## "):
                h = doc.add_heading(sline[3:].strip(), level=2)
                h.paragraph_format.space_before = Pt(14)
                h.paragraph_format.space_after = Pt(6)
            elif sline.startswith("### "):
                h = doc.add_heading(sline[4:].strip(), level=3)
                h.paragraph_format.space_before = Pt(10)
                h.paragraph_format.space_after = Pt(4)
            elif sline.startswith("#### "):
                h = doc.add_heading(sline[5:].strip(), level=4)
                h.paragraph_format.space_before = Pt(8)
                h.paragraph_format.space_after = Pt(2)
            elif sline.startswith("- ") or sline.startswith("* "):
                p_l = doc.add_paragraph(style='List Bullet')
                format_run_text(p_l, sline[2:].strip())
                p_l.paragraph_format.space_after = Pt(2)
            elif re.match(r"^\d+\.\s", sline):
                p_n = doc.add_paragraph(style='List Number')
                clean_num_text = re.sub(r"^\d+\.\s*", "", sline)
                format_run_text(p_n, clean_num_text)
                p_n.paragraph_format.space_after = Pt(2)
            elif sline.startswith(">"):
                p_q = doc.add_paragraph()
                p_q.paragraph_format.left_indent = Inches(0.4)
                p_q.paragraph_format.space_before = Pt(4)
                p_q.paragraph_format.space_after = Pt(4)
                clean_q = re.sub(r"^>\s*(\[!.*?\])?\s*", "", sline)
                r_q = p_q.add_run(clean_q)
                r_q.italic = True
                r_q.font.color.rgb = RGBColor(71, 85, 105)
            elif sline == "---":
                pass
            elif sline == "":
                pass
            else:
                p_b = doc.add_paragraph()
                format_run_text(p_b, sline)
                p_b.paragraph_format.space_after = Pt(5)

            i += 1

        if in_table and table_buffer:
            render_markdown_table_to_docx(doc, table_buffer)

    print(f"Guardando archivo DOCX en {OUTPUT_DOCX}...")
    doc.save(OUTPUT_DOCX)
    print(f"DOCX generado con éxito ({os.path.getsize(OUTPUT_DOCX)} bytes)")

def format_run_text(paragraph, text):
    """Parsea markdown básico (**negrita**, *cursiva*, `código`) y añade runs."""
    tokens = re.split(r"(\*\*.*?\*\*|\*.*?\*|`.*?`)", text)
    for tok in tokens:
        if not tok:
            continue
        if tok.startswith("**") and tok.endswith("**"):
            r = paragraph.add_run(tok[2:-2])
            r.bold = True
        elif tok.startswith("*") and tok.endswith("*"):
            r = paragraph.add_run(tok[1:-1])
            r.italic = True
        elif tok.startswith("`") and tok.endswith("`"):
            r = paragraph.add_run(tok[1:-1])
            r.font.name = 'Consolas'
            r.font.size = Pt(9.5)
            r.font.color.rgb = RGBColor(30, 41, 59)
        else:
            paragraph.add_run(tok)

def render_markdown_table_to_docx(doc, raw_lines):
    rows_data = []
    for l in raw_lines:
        s = l.strip()
        if not s:
            continue
        if re.match(r"^\|(\s*:?-+:?\s*\|)+$", s):
            continue
        cells = [c.strip() for c in s.strip("|").split("|")]
        rows_data.append(cells)

    if not rows_data:
        return

    num_rows = len(rows_data)
    num_cols = max(len(r) for r in rows_data)

    table = doc.add_table(rows=num_rows, cols=num_cols)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = True

    for r_idx, row in enumerate(rows_data):
        for c_idx in range(num_cols):
            val = row[c_idx] if c_idx < len(row) else ""
            cell = table.cell(r_idx, c_idx)
            cell_p = cell.paragraphs[0]
            cell_p.paragraph_format.space_before = Pt(2)
            cell_p.paragraph_format.space_after = Pt(2)
            run = cell_p.add_run(val)
            run.font.size = Pt(8.5)

            if r_idx == 0:
                run.bold = True
                run.font.color.rgb = RGBColor(255, 255, 255)
                shading = parse_xml(r'<w:shd {} w:fill="1E3A8A"/>'.format(nsdecls('w')))
                cell._tc.get_or_add_tcPr().append(shading)
            else:
                if r_idx % 2 == 1:
                    shading = parse_xml(r'<w:shd {} w:fill="F8FAFC"/>'.format(nsdecls('w')))
                    cell._tc.get_or_add_tcPr().append(shading)

    p_spacer = doc.add_paragraph()
    p_spacer.paragraph_format.space_after = Pt(6)

if __name__ == "__main__":
    generate_pdf()
    generate_docx()
    print("\n✅ Compilación finalizada exitosamente para PDF y Word.")
