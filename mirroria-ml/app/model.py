"""
Manejador de modelos y motor de inferencia asíncrona para mirroria-ml.
Carga los artefactos serializados .joblib y ejecuta inferencias en hilos desacoplados (asyncio.to_thread).
"""

from __future__ import annotations
import asyncio
import json
import math
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np
import pandas as pd

from app.schemas import (
    AnomaliasPredictRequest,
    AnomaliasPredictResponse,
    ClientaRfmOutput,
    DemandaPredictRequest,
    DemandaPredictResponse,
    DiagnosticoAnomaliaOutput,
    KpisDemandaResumen,
    NoShowPredictRequest,
    NoShowPredictResponse,
    PrendaDemandaOutput,
    ReservaNoShowOutput,
    RfmPredictRequest,
    RfmPredictResponse,
)

BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"

CATEGORIA_MAP = {
    "VESTIDOS": 0,
    "BLUSAS": 1,
    "PANTALONES": 2,
    "CALZADOS": 3,
    "ACCESORIOS": 4,
}

SUCURSAL_MAP = {
    "suc_equipetrol": 0,
    "suc_centro": 1,
    "suc_calacoto": 2,
}

METODO_PAGO_MAP = {
    "EFECTIVO": 0,
    "WAYRA_QR": 1,
    "STRIPE": 2,
    "TARJETA": 2,
}


class MLModelManager:
    """
    Singleton que gestiona el ciclo de vida de los 4 modelos de Machine Learning.
    """

    def __init__(self, models_dir: Path = MODELS_DIR):
        self.models_dir = models_dir
        self.demanda_model = None
        self.noshow_model = None
        self.rfm_scaler = None
        self.rfm_kmeans = None
        self.rfm_cluster_labels: Dict[int, str] = {}
        self.anomalias_model = None
        self.metrics_data: Dict[str, Any] = {}
        self.loaded: bool = False

    def load(self):
        """Carga sincrónica en el arranque (lifespan)"""
        try:
            self.demanda_model = joblib.load(self.models_dir / "demanda_rf.joblib")
            self.noshow_model = joblib.load(self.models_dir / "noshow_logreg.joblib")
            self.rfm_scaler = joblib.load(self.models_dir / "rfm_scaler.joblib")
            self.rfm_kmeans = joblib.load(self.models_dir / "rfm_kmeans.joblib")
            self.anomalias_model = joblib.load(self.models_dir / "anomalias_iforest.joblib")

            metrics_path = self.models_dir / "metrics.json"
            if not metrics_path.exists():
                metrics_path = self.models_dir / "metricas_evaluacion.json"
            if metrics_path.exists():
                with open(metrics_path, "r", encoding="utf-8") as f:
                    self.metrics_data = json.load(f)

            # Calibrar etiquetas semánticas de clusters RFM
            self._calibrate_rfm_labels()
            self.loaded = True
            print("✅ Modelos ML cargados exitosamente en memoria.")
        except Exception as e:
            print(f"⚠️ Error cargando modelos ML: {e}")
            self.loaded = False

    def _calibrate_rfm_labels(self):
        if self.rfm_scaler is None or self.rfm_kmeans is None:
            return
        centers = self.rfm_scaler.inverse_transform(self.rfm_kmeans.cluster_centers_)
        mapping = {}
        for idx, (r, f, m) in enumerate(centers):
            if m > 350_000 and f >= 6:
                mapping[idx] = "VIPS_LEALES"
            elif r < 30 and f <= 3:
                mapping[idx] = "POTENCIALES_NUEVAS"
            elif r > 80 and m > 150_000:
                mapping[idx] = "EN_RIESGO_DORMIDAS"
            else:
                mapping[idx] = "OCASIONALES_OUTLET"
        self.rfm_cluster_labels = mapping

    def is_healthy(self) -> Dict[str, bool]:
        return {
            "demanda_rf": self.demanda_model is not None,
            "noshow_logreg": self.noshow_model is not None,
            "rfm_kmeans": self.rfm_kmeans is not None and self.rfm_scaler is not None,
            "anomalias_iforest": self.anomalias_model is not None,
            "metrics_loaded": bool(self.metrics_data),
        }

    # ------------------------------------------------------------------------
    # M1: PREDICCIÓN DE DEMANDA
    # ------------------------------------------------------------------------
    def _sync_predict_demanda(self, req: DemandaPredictRequest) -> DemandaPredictResponse:
        now = datetime.now()
        current_month = now.month
        current_weekday = now.weekday()

        features = []
        for p in req.prendas:
            cat_idx = CATEGORIA_MAP.get(p.categoria.upper(), 0)
            suc_idx = SUCURSAL_MAP.get(p.sucursal_id.lower(), 0)
            es_alta = 1 if p.es_temporada_alta else (1 if current_month in [5, 9, 12] else 0)
            row = [
                cat_idx,
                suc_idx,
                current_month,
                current_weekday,
                p.precio_cents,
                p.descuento_pct,
                es_alta,
                p.demanda_historica_lag7,
            ]
            features.append(row)

        feature_cols = [
            "categoria_idx",
            "sucursal_idx",
            "mes",
            "dia_semana",
            "precio_cents",
            "descuento_pct",
            "es_temporada_alta",
            "demanda_historica_lag7",
        ]
        X = pd.DataFrame(features, columns=feature_cols)
        y_raw = self.demanda_model.predict(X)

        # Ajuste por horizonte temporal (el modelo fue entrenado a 30 días)
        scale_factor = req.horizonte_dias / 30.0

        predicciones: List[PrendaDemandaOutput] = []
        quiebres_count = 0
        total_demanda_estimada = 0.0
        total_stock = 0

        for p, raw_val in zip(req.prendas, y_raw):
            demanda_est = round(float(raw_val * scale_factor), 1)
            demanda_est = max(0.5, demanda_est)
            total_demanda_estimada += demanda_est
            total_stock += p.stock_actual

            # Reabastecimiento sugerido con 20% de stock de seguridad
            reabastecimiento = max(0, math.ceil(demanda_est * 1.20) - p.stock_actual)

            # Días de stock estimados
            if demanda_est > 0:
                dias_stock = round((p.stock_actual / demanda_est) * req.horizonte_dias, 1)
            else:
                dias_stock = 999.0

            # Evaluación de riesgo de quiebre
            if p.stock_actual == 0 and demanda_est > 0:
                riesgo = "CRITICO"
                quiebres_count += 1
            elif dias_stock < 7.0:
                riesgo = "ALTO"
                quiebres_count += 1
            elif dias_stock < 20.0:
                riesgo = "MEDIO"
            else:
                riesgo = "BAJO"

            predicciones.append(
                PrendaDemandaOutput(
                    producto_id=p.producto_id,
                    demanda_proyectada_unidades=demanda_est,
                    stock_actual=p.stock_actual,
                    reabastecimiento_sugerido=reabastecimiento,
                    riesgo_quiebre=riesgo,
                    dias_de_stock_estimados=dias_stock,
                )
            )

        n = len(predicciones)
        quiebre_pct = round((quiebres_count / n) * 100.0, 1) if n > 0 else 0.0
        rotacion = round(total_demanda_estimada / (total_stock + 1.0), 2)

        return DemandaPredictResponse(
            horizonte_dias=req.horizonte_dias,
            total_items_evaluados=n,
            predicciones=predicciones,
            kpis_resumen=KpisDemandaResumen(
                quiebre_stock_rate_pct=quiebre_pct,
                rotacion_proyectada=rotacion,
            ),
        )

    async def predict_demanda(self, req: DemandaPredictRequest) -> DemandaPredictResponse:
        return await asyncio.to_thread(self._sync_predict_demanda, req)

    # ------------------------------------------------------------------------
    # M2: EVALUACIÓN DE NO-SHOW
    # ------------------------------------------------------------------------
    def _sync_predict_noshow(self, req: NoShowPredictRequest) -> NoShowPredictResponse:
        features = []
        for r in req.reservas:
            row = [
                r.dias_anticipacion,
                r.hora_cita,
                r.dia_semana,
                r.prendas_apartadas_count,
                r.reservas_previas_total,
                r.tasa_asistencia_historica,
                1 if r.es_fin_de_semana else 0,
            ]
            features.append(row)

        feature_cols = [
            "dias_anticipacion",
            "hora_cita",
            "dia_semana",
            "prendas_apartadas_count",
            "reservas_previas_total",
            "tasa_asistencia_historica",
            "es_fin_de_semana",
        ]
        X = pd.DataFrame(features, columns=feature_cols)
        probabilidades = self.noshow_model.predict_proba(X)[:, 1]

        evaluaciones: List[ReservaNoShowOutput] = []
        for r, prob in zip(req.reservas, probabilidades):
            p_val = round(float(prob), 3)

            # Clasificación y semáforo
            if p_val >= 0.65:
                clasificacion = "ALTO_RIESGO"
                color = "ROJO"
                accion = "CONFIRMAR_WHATSAPP_PRIORITARIO"
            elif p_val >= 0.35:
                clasificacion = "RIESGO_MEDIO"
                color = "AMARILLO"
                accion = "MONITOREAR"
            else:
                clasificacion = "BAJO_RIESGO"
                color = "VERDE"
                accion = "ASISTIRA_NORMAL"

            # Factores explicativos del riesgo
            factores = []
            if r.dias_anticipacion >= 7:
                factores.append(f"Reserva realizada con {r.dias_anticipacion} días de anticipación (+28%)")
            if r.reservas_previas_total == 0:
                factores.append("Clienta sin historial previo de reservas (+15%)")
            if r.prendas_apartadas_count >= 4:
                factores.append(f"Alto número de prendas solicitadas ({r.prendas_apartadas_count} prendas)")
            if not r.es_fin_de_semana:
                factores.append("Cita programada en día de semana laboral")
            if r.tasa_asistencia_historica < 0.60:
                factores.append(f"Historial de asistencia bajo ({int(r.tasa_asistencia_historica*100)}%)")

            if not factores:
                factores.append("Perfil de asistencia confiable y confirmación estándar")

            evaluaciones.append(
                ReservaNoShowOutput(
                    reserva_id=r.reserva_id,
                    probabilidad_no_show=p_val,
                    clasificacion=clasificacion,
                    color_semaforo=color,
                    accion_recomendada=accion,
                    factores_clave=factores,
                )
            )

        return NoShowPredictResponse(evaluaciones=evaluaciones)

    async def predict_noshow(self, req: NoShowPredictRequest) -> NoShowPredictResponse:
        return await asyncio.to_thread(self._sync_predict_noshow, req)

    # ------------------------------------------------------------------------
    # M3: SEGMENTACIÓN RFM
    # ------------------------------------------------------------------------
    def _sync_predict_rfm(self, req: RfmPredictRequest) -> RfmPredictResponse:
        features = [[c.recency_dias, c.frequency_compras, c.monetary_cents] for c in req.clientas]
        feature_cols = ["recency_dias", "frequency_compras", "monetary_cents"]
        X = pd.DataFrame(features, columns=feature_cols)
        X_scaled = self.rfm_scaler.transform(X)
        cluster_preds = self.rfm_kmeans.predict(X_scaled)

        distribucion = {
            "VIPS_LEALES": 0,
            "POTENCIALES_NUEVAS": 0,
            "EN_RIESGO_DORMIDAS": 0,
            "OCASIONALES_OUTLET": 0,
        }

        estrategias = {
            "VIPS_LEALES": "Acceso prioritario a colecciones cápsula y atención personalizada en probador",
            "POTENCIALES_NUEVAS": "Campaña de bienvenida con cupón de 2da compra con vigencia de 14 días",
            "EN_RIESGO_DORMIDAS": "Campaña de rescate 'Te extrañamos en Tiendaria' con 15% de descuento",
            "OCASIONALES_OUTLET": "Campañas masivas de liquidación de temporada y remates de colección",
        }

        clasificadas: List[ClientaRfmOutput] = []
        for c, cl_id in zip(req.clientas, cluster_preds):
            cluster_int = int(cl_id)
            segmento = self.rfm_cluster_labels.get(cluster_int, "OCASIONALES_OUTLET")
            distribucion[segmento] = distribucion.get(segmento, 0) + 1

            # Estimación CLV en Bs
            monto_bs = c.monetary_cents / 100.0
            if segmento == "VIPS_LEALES":
                clv = round(monto_bs * 1.35, 2)
            elif segmento == "POTENCIALES_NUEVAS":
                clv = round(monto_bs * 2.10, 2)
            elif segmento == "EN_RIESGO_DORMIDAS":
                clv = round(monto_bs * 1.15, 2)
            else:
                clv = round(monto_bs * 1.05, 2)

            clasificadas.append(
                ClientaRfmOutput(
                    clienta_id=c.clienta_id,
                    cluster_id=cluster_int,
                    segmento=segmento,
                    clv_estimado_bs=clv,
                    estrategia_sugerida=estrategias.get(segmento, ""),
                )
            )

        return RfmPredictResponse(
            total_clientas=len(clasificadas),
            distribucion_clusters=distribucion,
            clientas_clasificadas=clasificadas,
        )

    async def predict_rfm(self, req: RfmPredictRequest) -> RfmPredictResponse:
        return await asyncio.to_thread(self._sync_predict_rfm, req)

    # ------------------------------------------------------------------------
    # M4: TRANSACCIONES ANÓMALAS
    # ------------------------------------------------------------------------
    def _sync_predict_anomalias(self, req: AnomaliasPredictRequest) -> AnomaliasPredictResponse:
        features = []
        for t in req.transacciones:
            metodo_idx = METODO_PAGO_MAP.get(t.metodo_pago.upper(), 0)
            row = [
                t.monto_total_cents,
                t.cantidad_items,
                t.hora_venta,
                t.descuento_cents,
                t.ratio_descuento,
                metodo_idx,
            ]
            features.append(row)

        feature_cols = [
            "monto_total_cents",
            "cantidad_items",
            "hora_venta",
            "descuento_cents",
            "ratio_descuento",
            "metodo_pago",
        ]
        X = pd.DataFrame(features, columns=feature_cols)
        scores = self.anomalias_model.decision_function(X)
        preds = self.anomalias_model.predict(X)

        diagnosticos: List[DiagnosticoAnomaliaOutput] = []
        anomalias_count = 0

        for t, s, p in zip(req.transacciones, scores, preds):
            s_val = round(float(s), 3)
            es_anomalo = bool(p == -1 or s_val < 0.0)

            motivos = []
            if t.ratio_descuento >= 0.65:
                motivos.append(f"Descuento extremo ({int(t.ratio_descuento*100)}%) aplicado en ticket")
            if t.hora_venta < 6 or t.hora_venta > 23:
                motivos.append(f"Emisión fuera de horario comercial habitual ({t.hora_venta:02d}:00)")
            if t.cantidad_items >= 6 and t.monto_total_cents < 3_000:
                motivos.append(f"Monto total insignificante (Bs {t.monto_total_cents/100:.2f}) para {t.cantidad_items} prendas")
            if t.monto_total_cents > 250_000 and t.metodo_pago.upper() == "EFECTIVO":
                motivos.append("Importe en efectivo atípicamente elevado")

            if es_anomalo:
                anomalias_count += 1
                if s_val < -0.12 or len(motivos) >= 2:
                    nivel = "CRITICO"
                else:
                    nivel = "MODERADO"
                motivo_texto = " | ".join(motivos) if motivos else "Desviación multidimensional detectada por Isolation Forest"
            else:
                nivel = "NORMAL"
                motivo_texto = None

            diagnosticos.append(
                DiagnosticoAnomaliaOutput(
                    venta_id=t.venta_id,
                    score_anomalia=s_val,
                    es_anomalo=es_anomalo,
                    nivel_riesgo=nivel,
                    motivo_sospecha=motivo_texto,
                )
            )

        return AnomaliasPredictResponse(
            total_analizadas=len(diagnosticos),
            anomalias_detectadas=anomalias_count,
            diagnosticos=diagnosticos,
        )

    async def predict_anomalias(self, req: AnomaliasPredictRequest) -> AnomaliasPredictResponse:
        return await asyncio.to_thread(self._sync_predict_anomalias, req)

    # ------------------------------------------------------------------------
    # MÉTRICAS CIENTÍFICAS
    # ------------------------------------------------------------------------
    def get_metrics(self) -> Dict[str, Any]:
        return self.metrics_data


# Instancia global compartida
ml_manager = MLModelManager()
