"""
Pruebas de integración para los 5 endpoints del microservicio mirroria-ml con pytest y TestClient.
"""

from __future__ import annotations
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_health(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "OK"
    assert data["service"] == "mirroria-ml"
    assert "modelos_cargados" in data
    assert data["modelos_cargados"]["demanda_rf"] is True
    assert data["modelos_cargados"]["noshow_logreg"] is True
    assert data["modelos_cargados"]["rfm_kmeans"] is True
    assert data["modelos_cargados"]["anomalias_iforest"] is True


def test_predict_demanda(client: TestClient):
    payload = {
        "tenant_id": "tiendaria",
        "horizonte_dias": 30,
        "prendas": [
            {
                "producto_id": "prod_vestido_seda_01",
                "categoria": "VESTIDOS",
                "sucursal_id": "suc_equipetrol",
                "precio_cents": 35000,
                "descuento_pct": 10.0,
                "es_temporada_alta": True,
                "stock_actual": 4,
                "demanda_historica_lag7": 6.0,
            },
            {
                "producto_id": "prod_blusa_lino_02",
                "categoria": "BLUSAS",
                "sucursal_id": "suc_centro",
                "precio_cents": 18000,
                "descuento_pct": 0.0,
                "es_temporada_alta": False,
                "stock_actual": 25,
                "demanda_historica_lag7": 4.0,
            },
        ],
    }
    response = client.post("/predict/demanda", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["horizonte_dias"] == 30
    assert data["total_items_evaluados"] == 2
    assert len(data["predicciones"]) == 2

    p1 = data["predicciones"][0]
    assert p1["producto_id"] == "prod_vestido_seda_01"
    assert p1["demanda_proyectada_unidades"] > 0
    assert p1["riesgo_quiebre"] in ["BAJO", "MEDIO", "ALTO", "CRITICO"]
    assert "reabastecimiento_sugerido" in p1
    assert "dias_de_stock_estimados" in p1

    kpis = data["kpis_resumen"]
    assert "quiebre_stock_rate_pct" in kpis
    assert "rotacion_proyectada" in kpis


def test_predict_noshow(client: TestClient):
    payload = {
        "tenant_id": "tiendaria",
        "reservas": [
            {
                "reserva_id": "res_cita_9041",
                "dias_anticipacion": 10,
                "hora_cita": 15,
                "dia_semana": 1,
                "prendas_apartadas_count": 4,
                "reservas_previas_total": 0,
                "tasa_asistencia_historica": 0.50,
                "es_fin_de_semana": False,
            },
            {
                "reserva_id": "res_cita_9042",
                "dias_anticipacion": 1,
                "hora_cita": 17,
                "dia_semana": 5,
                "prendas_apartadas_count": 1,
                "reservas_previas_total": 8,
                "tasa_asistencia_historica": 0.95,
                "es_fin_de_semana": True,
            },
        ],
    }
    response = client.post("/predict/no-show", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "evaluaciones" in data
    assert len(data["evaluaciones"]) == 2

    # Reserva con 10 días de anticipación y clienta nueva debe tener mayor probabilidad de no-show
    r1 = data["evaluaciones"][0]
    r2 = data["evaluaciones"][1]
    assert r1["probabilidad_no_show"] > r2["probabilidad_no_show"]
    assert r1["color_semaforo"] in ["VERDE", "AMARILLO", "ROJO"]
    assert len(r1["factores_clave"]) > 0


def test_predict_rfm(client: TestClient):
    payload = {
        "tenant_id": "tiendaria",
        "clientas": [
            {
                "clienta_id": "cli_maria_vip",
                "recency_dias": 12.0,
                "frequency_compras": 10,
                "monetary_cents": 500000,
            },
            {
                "clienta_id": "cli_claudia_riesgo",
                "recency_dias": 130.0,
                "frequency_compras": 5,
                "monetary_cents": 320000,
            },
        ],
    }
    response = client.post("/predict/rfm", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total_clientas"] == 2
    assert "distribucion_clusters" in data
    assert len(data["clientas_clasificadas"]) == 2

    vip = data["clientas_clasificadas"][0]
    assert vip["segmento"] == "VIPS_LEALES"
    assert vip["clv_estimado_bs"] > 0
    assert len(vip["estrategia_sugerida"]) > 0


def test_predict_anomalias(client: TestClient):
    payload = {
        "tenant_id": "tiendaria",
        "transacciones": [
            {
                "venta_id": "vta_normal_01",
                "monto_total_cents": 85000,
                "cantidad_items": 2,
                "hora_venta": 16,
                "descuento_cents": 4000,
                "ratio_descuento": 0.045,
                "metodo_pago": "WAYRA_QR",
            },
            {
                "venta_id": "vta_sospechosa_02",
                "monto_total_cents": 1200,
                "cantidad_items": 8,
                "hora_venta": 3,
                "descuento_cents": 50000,
                "ratio_descuento": 0.95,
                "metodo_pago": "EFECTIVO",
            },
        ],
    }
    response = client.post("/predict/anomalias", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total_analizadas"] == 2
    assert len(data["diagnosticos"]) == 2

    d1 = data["diagnosticos"][0]
    d2 = data["diagnosticos"][1]
    assert d1["es_anomalo"] is False
    assert d1["nivel_riesgo"] == "NORMAL"

    assert d2["es_anomalo"] is True
    assert d2["nivel_riesgo"] in ["MODERADO", "CRITICO"]
    assert d2["motivo_sospecha"] is not None


def test_metrics_evaluacion(client: TestClient):
    response = client.get("/metrics/evaluacion")
    assert response.status_code == 200
    data = response.json()
    assert "modelos" in data
    assert "M1_demanda_random_forest" in data["modelos"]
    assert "M2_noshow_logistic_regression" in data["modelos"]
    assert "M3_rfm_kmeans" in data["modelos"]
    assert "M4_anomalias_isolation_forest" in data["modelos"]

    m1 = data["modelos"]["M1_demanda_random_forest"]
    assert "r2_score" in m1["metricas"]
    assert m1["metricas"]["r2_score"] > 0.85

    m3 = data["modelos"]["M3_rfm_kmeans"]
    assert "silhouette_score" in m3["metricas"]
    assert m3["metricas"]["silhouette_score"] > 0.50
