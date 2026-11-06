"""
FastAPI Entrypoint con Lifespan context manager para el microservicio mirroria-ml.
Puerto interno: 8002.
"""

from __future__ import annotations
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from app.model import ml_manager
from app.schemas import (
    AnomaliasPredictRequest,
    AnomaliasPredictResponse,
    DemandaPredictRequest,
    DemandaPredictResponse,
    HealthResponse,
    NoShowPredictRequest,
    NoShowPredictResponse,
    RfmPredictRequest,
    RfmPredictResponse,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicialización y limpieza controlada del ciclo de vida de la aplicación."""
    print("🚀 Arrancando microservicio mirroria-ml...")
    ml_manager.load()
    yield
    print("🛑 Deteniendo microservicio mirroria-ml...")


app = FastAPI(
    title="MirrorIA Machine Learning Service",
    description="Microservicio de analítica predictiva y no supervisada orientada a KPIs de retail de moda femenina.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS permisivo para comunicación interna en red Docker o desarrollo local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse, tags=["Sistema"])
async def health_check() -> HealthResponse:
    """Verifica la operatividad del microservicio y el estado de los modelos en memoria."""
    status_dict = ml_manager.is_healthy()
    is_ok = all(status_dict.values())
    return HealthResponse(
        status="OK" if is_ok else "DEGRADED",
        service="mirroria-ml",
        version="1.0.0",
        modelos_cargados=status_dict,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@app.post("/predict/demanda", response_model=DemandaPredictResponse, tags=["M1 - Demanda"])
async def predict_demanda(request: DemandaPredictRequest) -> DemandaPredictResponse:
    """
    Predice la demanda de prendas a 7 o 30 días mediante RandomForestRegressor.
    Calcula riesgo de quiebre de stock y órdenes de reabastecimiento sugeridas.
    """
    if not ml_manager.demanda_model:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Modelo de demanda no disponible en memoria",
        )
    return await ml_manager.predict_demanda(request)


@app.post("/predict/no-show", response_model=NoShowPredictResponse, tags=["M2 - No-Show"])
async def predict_noshow(request: NoShowPredictRequest) -> NoShowPredictResponse:
    """
    Clasifica la probabilidad de inasistencia (No-Show) a reservas de probador mediante Regresión Logística L2.
    Retorna semáforo visual de riesgo (Verde, Amarillo, Rojo) y factores clave.
    """
    if not ml_manager.noshow_model:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Modelo de no-show no disponible en memoria",
        )
    return await ml_manager.predict_noshow(request)


@app.post("/predict/rfm", response_model=RfmPredictResponse, tags=["M3 - RFM Clustering"])
async def predict_rfm(request: RfmPredictRequest) -> RfmPredictResponse:
    """
    Segmenta la cartera de clientas según Recency, Frequency y Monetary mediante KMeans (K=4) + StandardScaler.
    Asigna segmentos: VIPS_LEALES, POTENCIALES_NUEVAS, EN_RIESGO_DORMIDAS u OCASIONALES_OUTLET.
    """
    if not ml_manager.rfm_kmeans or not ml_manager.rfm_scaler:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Modelo RFM no disponible en memoria",
        )
    return await ml_manager.predict_rfm(request)


@app.post("/predict/anomalias", response_model=AnomaliasPredictResponse, tags=["M4 - Anomalías"])
async def predict_anomalias(request: AnomaliasPredictRequest) -> AnomaliasPredictResponse:
    """
    Detecta transacciones atípicas o sospechosas en el POS mediante IsolationForest (contamination=0.03).
    Identifica descuentos abusivos, horarios no comerciales o errores de digitación.
    """
    if not ml_manager.anomalias_model:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Modelo de anomalías no disponible en memoria",
        )
    return await ml_manager.predict_anomalias(request)


@app.get("/metrics/evaluacion", tags=["Métricas Científicas"])
async def get_metrics_evaluacion() -> Dict[str, Any]:
    """Retorna la ficha técnica de validación científica de los 4 modelos (R2, MAE, AUC, F1, Silueta)."""
    metrics = ml_manager.get_metrics()
    if not metrics:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Métricas de evaluación no encontradas en disco",
        )
    return metrics


@app.get("/metrics", tags=["Métricas Científicas"])
async def get_metrics() -> Dict[str, Any]:
    """Alias para /metrics/evaluacion."""
    return await get_metrics_evaluacion()
