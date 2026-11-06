#!/usr/bin/env python3
import json
import os
import sys
import time
import urllib.request
from playwright.sync_api import sync_playwright

API = "http://localhost:3000/api/v1"
BASE_URL = "http://localhost"
CAPTURAS_DIR = "/home/lmc/projects/MirrorIA/scripts/qa/capturas"

def get_admin_auth():
    url = f"{API}/seguridad/auth/login"
    data = json.dumps({"email": "admin@mirroria.com", "password": "Mirroria2026!"}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json", "X-Tenant": "tiendaria"},
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        body = json.loads(resp.read().decode("utf-8"))
        return body["accessToken"], body["usuario"]

def main():
    os.makedirs(CAPTURAS_DIR, exist_ok=True)
    print("Obteniendo token de autenticación ADMIN...")
    token, usuario = get_admin_auth()
    print(f"Autenticado: {usuario['fullName']} ({usuario['email']}) - Rol: {usuario['role']}")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # 1440x900 desktop viewport
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # ---------------------------------------------------------
        # Captura 1: Navbar de la tienda en desktop (tiendaria y casa-andina)
        # ---------------------------------------------------------
        print("1. Capturando Navbar en /t/tiendaria...")
        page.goto(f"{BASE_URL}/t/tiendaria", wait_until="networkidle")
        time.sleep(1)
        # Captura completa
        page.screenshot(path=f"{CAPTURAS_DIR}/01_navbar_tiendaria_desktop.png")
        # Captura específica de la navbar
        header = page.locator("header")
        if header.count() > 0:
            header.screenshot(path=f"{CAPTURAS_DIR}/01_navbar_tiendaria_header_only.png")

        print("1b. Capturando Navbar en /t/casa-andina...")
        page.goto(f"{BASE_URL}/t/casa-andina", wait_until="networkidle")
        time.sleep(1)
        page.screenshot(path=f"{CAPTURAS_DIR}/01_navbar_casa_andina_desktop.png")
        header = page.locator("header")
        if header.count() > 0:
            header.screenshot(path=f"{CAPTURAS_DIR}/01_navbar_casa_andina_header_only.png")

        # ---------------------------------------------------------
        # Captura 2: Modal de búsqueda y menú de usuario al abrirse en la navbar
        # ---------------------------------------------------------
        print("2a. Abriendo modal de búsqueda...")
        page.goto(f"{BASE_URL}/t/tiendaria", wait_until="networkidle")
        time.sleep(1)
        search_btn = page.locator('button[aria-label="Buscar productos"]')
        search_btn.click()
        time.sleep(0.5)
        page.screenshot(path=f"{CAPTURAS_DIR}/02_modal_busqueda_abierto.png")

        print("2b. Autenticando sesión y abriendo menú de usuario en navbar...")
        # Inyectar sesión en localStorage
        page.evaluate(f"""() => {{
            localStorage.setItem('mirroria_token', '{token}');
            localStorage.setItem('mirroria_user', JSON.stringify({json.dumps(usuario)}));
        }}""")
        page.reload(wait_until="networkidle")
        time.sleep(1)
        user_menu_btn = page.locator('button[aria-label="Abrir menú de usuario"]')
        user_menu_btn.wait_for(state="visible", timeout=5000)
        user_menu_btn.click()
        time.sleep(0.5)
        page.screenshot(path=f"{CAPTURAS_DIR}/02_menu_usuario_abierto.png")

        # ---------------------------------------------------------
        # Captura 3: Panel de Predicciones & Machine Learning (/admin/ml) - Overview
        # ---------------------------------------------------------
        print("3. Capturando /admin/ml (Resumen / Overview)...")
        page.goto(f"{BASE_URL}/admin/ml", wait_until="networkidle")
        time.sleep(2)
        page.screenshot(path=f"{CAPTURAS_DIR}/03_ml_dashboard_overview.png", full_page=True)

        # ---------------------------------------------------------
        # Captura 4: Pestañas de Demanda, No-Show (Citas), RFM, Auditoría y Validación Científica
        # ---------------------------------------------------------
        print("4a. Capturando pestaña Demanda...")
        tab_demanda = page.locator('button[role="tab"]:has-text("Demanda")')
        tab_demanda.click()
        time.sleep(1)
        page.screenshot(path=f"{CAPTURAS_DIR}/04_ml_tab_demanda.png", full_page=True)

        print("4b. Capturando pestaña No-Show (Citas)...")
        tab_noshow = page.locator('button[role="tab"]:has-text("No-Show")')
        tab_noshow.click()
        time.sleep(1)
        page.screenshot(path=f"{CAPTURAS_DIR}/04_ml_tab_noshow.png", full_page=True)

        print("4c. Capturando pestaña RFM (Clientas)...")
        tab_rfm = page.locator('button[role="tab"]:has-text("Clientas")')
        tab_rfm.click()
        time.sleep(1)
        page.screenshot(path=f"{CAPTURAS_DIR}/04_ml_tab_rfm.png", full_page=True)

        print("4d. Capturando pestaña Auditoría (Anomalías)...")
        tab_auditoria = page.locator('button[role="tab"]:has-text("Auditoría")')
        tab_auditoria.click()
        time.sleep(1)
        page.screenshot(path=f"{CAPTURAS_DIR}/04_ml_tab_anomalias.png", full_page=True)

        print("4e. Capturando modal de Ficha Técnica (Validación Científica)...")
        btn_ficha = page.locator('button:has-text("Ficha")')
        if btn_ficha.count() > 0:
            btn_ficha.first.click()
            time.sleep(1)
            page.screenshot(path=f"{CAPTURAS_DIR}/04_ml_tab_validacion_cientifica.png", full_page=True)
            page.keyboard.press("Escape")
            time.sleep(0.5)

        browser.close()
        print("¡Todas las capturas se guardaron exitosamente en:", CAPTURAS_DIR)

if __name__ == "__main__":
    main()
