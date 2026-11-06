"""
Modelos Pydantic v2 para validación estricta y contratos OpenAPI del microservicio mirroria-ml.
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ============================================================================
# M1: PREDICCIÓN DE DEMANDA (Regresión)
# ============================================================================

class PrendaDemandaInput(BaseModel):
    producto_id: str = Field(..., description="Identificador único del producto o variante")
    categoria: str = Field("VESTIDOS", description="Categoría de moda (VESTIDOS, BLUSAS, PANTALONES, CALZADOS, ACCESORIOS)")
    sucursal_id: str = Field("suc_equipetrol", description="Identificador de la sucursal física")
    precio_cents: int = Field(28000, ge=0, description="Precio regular en centavos de Bs")
    descuento_pct: float = Field(0.0, ge=0.0, le=100.0, description="Porcentaje de descuento promocional")
    es_temporada_alta: bool = Field(False, description="Indicador de temporada alta (Mayo, Septiembre, Diciembre)")
    stock_actual: int = Field(0, ge=0, description="Stock actual disponible en inventario")
    demanda_historica_lag7: float = Field(0.0, ge=0.0, description="Unidades vendidas en los últimos 7 días")


class DemandaPredictRequest(BaseModel):
    tenant_id: str = Field("tiendaria", description="Inquilino SaaS")
    horizonte_dias: int = Field(30, ge=1, le=90, description="Horizonte de predicción (7 o 30 días)")
    prendas: List[PrendaDemandaInput] = Field(..., min_length=1, description="Lista de prendas a evaluar")


class PrendaDemandaOutput(BaseModel):
    producto_id: str
    demanda_proyectada_unidades: float
    stock_actual: int
    reabastecimiento_sugerido: int
    riesgo_quiebre: str = Field(..., description="BAJO, MEDIO, ALTO o CRITICO")
    dias_de_stock_estimados: float


class KpisDemandaResumen(BaseModel):
    quiebre_stock_rate_pct: float
    rotacion_proyectada: float


class DemandaPredictResponse(BaseModel):
    horizonte_dias: int
    total_items_evaluados: int
    predicciones: List[PrendaDemandaOutput]
    kpis_resumen: KpisDemandaResumen


# ============================================================================
# M2: EVALUACIÓN DE NO-SHOW EN RESERVAS (Clasificación)
# ============================================================================

class ReservaNoShowInput(BaseModel):
    reserva_id: str = Field(..., description="ID de la reserva de probador")
    dias_anticipacion: int = Field(..., ge=0, description="Días entre creación y fecha de cita")
    hora_cita: int = Field(..., ge=0, le=23, description="Hora programada (24h)")
    dia_semana: int = Field(..., ge=0, le=6, description="0=Lunes, 6=Domingo")
    prendas_apartadas_count: int = Field(1, ge=1, description="Cantidad de prendas apartadas para el probador")
    reservas_previas_total: int = Field(0, ge=0, description="Historial de reservas de la clienta")
    tasa_asistencia_historica: float = Field(0.78, ge=0.0, le=1.0, description="Ratio de asistencia histórico (0.78 para nuevas)")
    es_fin_de_semana: bool = Field(False, description="True si la cita es sábado o domingo")


class NoShowPredictRequest(BaseModel):
    tenant_id: str = Field("tiendaria", description="Inquilino SaaS")
    reservas: List[ReservaNoShowInput] = Field(..., min_length=1)


class ReservaNoShowOutput(BaseModel):
    reserva_id: str
    probabilidad_no_show: float
    clasificacion: str = Field(..., description="BAJO_RIESGO, RIESGO_MEDIO o ALTO_RIESGO")
    color_semaforo: str = Field(..., description="VERDE, AMARILLO o ROJO")
    accion_recomendada: str = Field(..., description="Acción de mitigación comercial")
    factores_clave: List[str]


class NoShowPredictResponse(BaseModel):
    evaluaciones: List[ReservaNoShowOutput]


# ============================================================================
# M3: SEGMENTACIÓN RFM (Clustering)
# ============================================================================

class ClientaRfmInput(BaseModel):
    clienta_id: str
    recency_dias: float = Field(..., ge=0.0, description="Días desde su última compra")
    frequency_compras: int = Field(..., ge=0, description="Número de compras en los últimos 365 días")
    monetary_cents: int = Field(..., ge=0, description="Monto acumulado facturado en centavos")


class RfmPredictRequest(BaseModel):
    tenant_id: str = Field("tiendaria", description="Inquilino SaaS")
    clientas: List[ClientaRfmInput] = Field(..., min_length=1)


class ClientaRfmOutput(BaseModel):
    clienta_id: str
    cluster_id: int
    segmento: str = Field(..., description="VIPS_LEALES, POTENCIALES_NUEVAS, EN_RIESGO_DORMIDAS o OCASIONALES_OUTLET")
    clv_estimado_bs: float
    estrategia_sugerida: str


class RfmPredictResponse(BaseModel):
    total_clientas: int
    distribucion_clusters: Dict[str, int]
    clientas_clasificadas: List[ClientaRfmOutput]


# ============================================================================
# M4: TRANSACCIONES ANÓMALAS (Isolation Forest)
# ============================================================================

class TransaccionAnomaliaInput(BaseModel):
    venta_id: str
    monto_total_cents: int = Field(..., ge=0)
    cantidad_items: int = Field(..., ge=1)
    hora_venta: int = Field(..., ge=0, le=23)
    descuento_cents: int = Field(0, ge=0)
    ratio_descuento: float = Field(0.0, ge=0.0, le=1.0)
    metodo_pago: str = Field("WAYRA_QR", description="EFECTIVO, WAYRA_QR, STRIPE")


class AnomaliasPredictRequest(BaseModel):
    tenant_id: str = Field("tiendaria", description="Inquilino SaaS")
    transacciones: List[TransaccionAnomaliaInput] = Field(..., min_length=1)


class DiagnosticoAnomaliaOutput(BaseModel):
    venta_id: str
    score_anomalia: float
    es_anomalo: bool
    nivel_riesgo: str = Field(..., description="NORMAL, MODERADO o CRITICO")
    motivo_sospecha: Optional[str] = None


class AnomaliasPredictResponse(BaseModel):
    total_analizadas: int
    anomalias_detectadas: int
    diagnosticos: List[DiagnosticoAnomaliaOutput]


# ============================================================================
# HEALTH & METRICS
# ============================================================================

class HealthResponse(BaseModel):
    status: str
    service: str = "mirroria-ml"
    version: str = "1.0.0"
    modelos_cargados: Dict[str, bool]
    timestamp: str
