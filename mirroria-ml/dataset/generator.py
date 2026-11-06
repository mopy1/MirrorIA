"""
Generador determinista de datos sintéticos para entrenamiento de modelos de Machine Learning.
Semilla fija seed=42, N=10.000 observaciones con estacionalidad boliviana y perfiles de moda.
"""

from __future__ import annotations
import math
import numpy as np
import pandas as pd

RANDOM_SEED = 42
TOTAL_SAMPLES = 10_000
TENANT_ID = "tiendaria"

CATEGORIA_MAP = {
    "VESTIDOS": 0,
    "BLUSAS": 1,
    "PANTALONES": 2,
    "CALZADOS": 3,
    "ACCESORIOS": 4,
}

METODO_PAGO_MAP = {
    "EFECTIVO": 0,
    "WAYRA_QR": 1,
    "STRIPE": 2,
    "TARJETA": 2,
}


def generate_demanda_dataset(n_samples: int = TOTAL_SAMPLES, seed: int = RANDOM_SEED) -> pd.DataFrame:
    """
    Genera dataset para M1 (RandomForestRegressor - Demanda de Prendas a 30 días).
    """
    rng = np.random.default_rng(seed)

    categorias = rng.choice(list(CATEGORIA_MAP.keys()), size=n_samples, p=[0.30, 0.25, 0.20, 0.15, 0.10])
    sucursales = rng.choice(["suc_equipetrol", "suc_centro", "suc_calacoto"], size=n_samples, p=[0.45, 0.35, 0.20])
    meses = rng.integers(1, 13, size=n_samples)
    dias_semana = rng.integers(0, 7, size=n_samples)

    # Precios en centavos: media ~ Bs 280 (28.000 cents), lognormal
    log_precios = rng.normal(loc=10.2, scale=0.45, size=n_samples)
    precios_cents = np.clip(np.exp(log_precios), 12_000, 145_000).astype(int)

    descuentos_pct = rng.choice([0, 5, 10, 15, 20, 30, 50], size=n_samples, p=[0.40, 0.15, 0.15, 0.10, 0.10, 0.07, 0.03])

    # Temporada alta: Mayo (Día de la Madre), Septiembre (Primavera/Expocruz), Diciembre (Navidad)
    es_temporada_alta = np.isin(meses, [5, 9, 12]).astype(int)

    # Demanda histórica lag 7 (unidades vendidas en la semana anterior)
    demanda_lag7 = rng.poisson(lam=5.5, size=n_samples) + (es_temporada_alta * 2)

    # Target: demanda proyectada 30 días
    # Base por categoría
    base_cat = np.array([CATEGORIA_MAP[c] for c in categorias])
    base_demanda = np.where(base_cat == 0, 16.0,  # VESTIDOS
                   np.where(base_cat == 1, 22.0,  # BLUSAS
                   np.where(base_cat == 2, 18.0,  # PANTALONES
                   np.where(base_cat == 3, 12.0, 9.0))))  # CALZADOS / ACCESORIOS

    factor_estacional = np.where(meses == 12, 1.9, np.where(meses == 5, 1.5, np.where(meses == 9, 1.35, 1.0)))
    factor_descuento = 1.0 + (descuentos_pct / 100.0) * 0.8
    factor_precio = 28_000 / (precios_cents + 5_000)

    ruido = rng.normal(0, 1.8, size=n_samples)
    demanda_30d = (
        (base_demanda * 0.4 + demanda_lag7 * 2.1)
        * factor_estacional
        * factor_descuento
        * (factor_precio ** 0.5)
        + ruido
    )
    demanda_30d = np.clip(np.round(demanda_30d, 1), 1.0, 120.0)

    # Stock actual para el dataset de simulación
    stock_actual = rng.integers(1, 30, size=n_samples)

    df = pd.DataFrame({
        "categoria": categorias,
        "categoria_idx": base_cat,
        "sucursal_id": sucursales,
        "sucursal_idx": [0 if s == "suc_equipetrol" else (1 if s == "suc_centro" else 2) for s in sucursales],
        "mes": meses,
        "dia_semana": dias_semana,
        "precio_cents": precios_cents,
        "descuento_pct": descuentos_pct,
        "es_temporada_alta": es_temporada_alta,
        "demanda_historica_lag7": demanda_lag7,
        "stock_actual": stock_actual,
        "demanda_30d": demanda_30d,
    })
    return df


def generate_noshow_dataset(n_samples: int = TOTAL_SAMPLES, seed: int = RANDOM_SEED) -> pd.DataFrame:
    """
    Genera dataset para M2 (LogisticRegression - Clasificación No-Show en Reservas de Probador).
    """
    rng = np.random.default_rng(seed)

    dias_anticipacion = rng.integers(0, 21, size=n_samples)
    hora_cita = rng.integers(10, 21, size=n_samples)
    dia_semana = rng.integers(0, 7, size=n_samples)
    prendas_apartadas = rng.integers(1, 6, size=n_samples)

    es_nueva_clienta = rng.choice([0, 1], size=n_samples, p=[0.65, 0.35])
    reservas_previas = np.where(es_nueva_clienta == 1, 0, rng.integers(1, 15, size=n_samples))

    # Tasa histórica de asistencia previa
    tasa_asistencia = np.where(
        es_nueva_clienta == 1,
        0.78,
        np.clip(rng.beta(a=8, b=2, size=n_samples), 0.2, 1.0)
    )

    es_fin_de_semana = (dia_semana >= 5).astype(int)

    # Función generadora de log-odds
    # Mayor anticipación -> mayor no-show
    # Días laborales (no fin de semana) -> mayor no-show
    # Menor tasa de asistencia previa -> mayor no-show
    z = (
        -1.75
        + 0.20 * dias_anticipacion
        + 0.15 * (1 - es_fin_de_semana)
        - 1.45 * (tasa_asistencia - 0.78)
        + 0.08 * prendas_apartadas
        - 0.05 * reservas_previas
        + rng.normal(0, 0.35, size=n_samples)
    )

    probabilidad = 1.0 / (1.0 + np.exp(-z))
    no_show = (rng.uniform(0, 1, size=n_samples) < probabilidad).astype(int)

    df = pd.DataFrame({
        "dias_anticipacion": dias_anticipacion,
        "hora_cita": hora_cita,
        "dia_semana": dia_semana,
        "prendas_apartadas_count": prendas_apartadas,
        "reservas_previas_total": reservas_previas,
        "tasa_asistencia_historica": tasa_asistencia,
        "es_fin_de_semana": es_fin_de_semana,
        "probabilidad_teorica": probabilidad,
        "no_show": no_show,
    })
    return df


def generate_rfm_dataset(n_samples: int = 1500, seed: int = RANDOM_SEED) -> pd.DataFrame:
    """
    Genera dataset para M3 (KMeans - Clustering RFM en 4 segmentos comerciales).
    Segmentos:
    0: VIPs / Leales (Recency bajo, Frequency alta, Monetary alto)
    1: Potenciales / Nuevas Promesas (Recency muy bajo, Frequency baja, Monetary medio)
    2: En Riesgo / Dormidas (Recency alto, Frequency media-alta, Monetary alto)
    3: Ocasionales / Cazadoras Ofertas (Recency muy alto, Frequency 1, Monetary bajo)
    """
    rng = np.random.default_rng(seed)

    # Asignación de tamaños por segmento
    n_vips = int(n_samples * 0.20)
    n_potenciales = int(n_samples * 0.30)
    n_en_riesgo = int(n_samples * 0.25)
    n_ocasionales = n_samples - (n_vips + n_potenciales + n_en_riesgo)

    # VIPs
    r_vips = np.clip(rng.normal(15, 7, n_vips), 1, 45)
    f_vips = np.clip(rng.normal(9, 2.5, n_vips), 5, 25).astype(int)
    m_vips = np.clip(rng.normal(460_000, 80_000, n_vips), 300_000, 950_000).astype(int)

    # Potenciales
    r_pot = np.clip(rng.normal(10, 4, n_potenciales), 1, 25)
    f_pot = np.clip(rng.normal(2, 0.7, n_potenciales), 1, 3).astype(int)
    m_pot = np.clip(rng.normal(110_000, 25_000, n_potenciales), 45_000, 195_000).astype(int)

    # En Riesgo
    r_riesgo = np.clip(rng.normal(135, 28, n_en_riesgo), 75, 220)
    f_riesgo = np.clip(rng.normal(5, 1.5, n_en_riesgo), 3, 10).astype(int)
    m_riesgo = np.clip(rng.normal(320_000, 60_000, n_en_riesgo), 180_000, 550_000).astype(int)

    # Ocasionales
    r_oca = np.clip(rng.normal(190, 40, n_ocasionales), 90, 365)
    f_oca = np.ones(n_ocasionales, dtype=int)
    m_oca = np.clip(rng.normal(28_000, 8_000, n_ocasionales), 8_000, 50_000).astype(int)

    recency = np.concatenate([r_vips, r_pot, r_riesgo, r_oca])
    frequency = np.concatenate([f_vips, f_pot, f_riesgo, f_oca])
    monetary = np.concatenate([m_vips, m_pot, m_riesgo, m_oca])

    # Generar IDs clientas
    clienta_ids = [f"cli_{i:04d}" for i in range(1, n_samples + 1)]

    df = pd.DataFrame({
        "clienta_id": clienta_ids,
        "recency_dias": np.round(recency, 1),
        "frequency_compras": frequency,
        "monetary_cents": monetary,
    })
    return df.sample(frac=1.0, random_state=seed).reset_index(drop=True)


def generate_anomalias_dataset(n_samples: int = TOTAL_SAMPLES, contamination: float = 0.03, seed: int = RANDOM_SEED) -> pd.DataFrame:
    """
    Genera dataset para M4 (IsolationForest - Transacciones Anómalas de Venta).
    Contaminación controlada del 3% (300 transacciones sobre 10.000).
    """
    rng = np.random.default_rng(seed)
    n_anomalas = int(n_samples * contamination)
    n_normales = n_samples - n_anomalas

    # Normales
    monto_normal = np.clip(np.exp(rng.normal(11.0, 0.65, n_normales)), 8_000, 250_000).astype(int)
    items_normal = rng.integers(1, 6, size=n_normales)
    hora_normal = rng.integers(9, 22, size=n_normales)
    ratio_desc_normal = rng.choice([0.0, 0.05, 0.10, 0.15, 0.20, 0.30], size=n_normales, p=[0.50, 0.18, 0.15, 0.10, 0.05, 0.02])
    desc_normal = (monto_normal * ratio_desc_normal).astype(int)
    metodo_normal = rng.choice([0, 1, 2], size=n_normales, p=[0.35, 0.45, 0.20])

    # Anómalas (3 tipos: Descuento brutal > 75%, Horario de madrugada 01:00-04:00 AM, Ítems extremos con monto minúsculo)
    monto_anomalo = []
    items_anomalo = []
    hora_anomalo = []
    desc_anomalo = []
    ratio_desc_anomalo = []
    metodo_anomalo = []

    for _ in range(n_anomalas):
        tipo = rng.integers(0, 3)
        if tipo == 0:
            # Descuento extremo > 75%
            m = int(rng.uniform(30_000, 150_000))
            r = float(rng.uniform(0.75, 0.98))
            d = int(m * r)
            h = int(rng.integers(10, 20))
            it = int(rng.integers(1, 4))
            p = int(rng.choice([0, 1]))
        elif tipo == 1:
            # Horario de madrugada con efectivo y muchos ítems
            m = int(rng.uniform(80_000, 300_000))
            r = 0.0
            d = 0
            h = int(rng.integers(1, 5))
            it = int(rng.integers(7, 15))
            p = 0  # Efectivo
        else:
            # Error de digitación: 8 ítems por menos de Bs 20
            m = int(rng.uniform(800, 2_000))
            r = 0.0
            d = 0
            h = int(rng.integers(11, 19))
            it = int(rng.integers(6, 12))
            p = int(rng.choice([0, 1, 2]))

        monto_anomalo.append(m)
        items_anomalo.append(it)
        hora_anomalo.append(h)
        desc_anomalo.append(d)
        ratio_desc_anomalo.append(round(r, 3))
        metodo_anomalo.append(p)

    monto = np.concatenate([monto_normal, monto_anomalo])
    items = np.concatenate([items_normal, items_anomalo])
    hora = np.concatenate([hora_normal, hora_anomalo])
    desc = np.concatenate([desc_normal, desc_anomalo])
    ratio = np.concatenate([ratio_desc_normal, ratio_desc_anomalo])
    metodo = np.concatenate([metodo_normal, metodo_anomalo])
    es_anomalo = np.concatenate([np.zeros(n_normales, dtype=int), np.ones(n_anomalas, dtype=int)])

    df = pd.DataFrame({
        "monto_total_cents": monto,
        "cantidad_items": items,
        "hora_venta": hora,
        "descuento_cents": desc,
        "ratio_descuento": ratio,
        "metodo_pago": metodo,
        "es_anomalo_real": es_anomalo,
    })
    return df.sample(frac=1.0, random_state=seed).reset_index(drop=True)
