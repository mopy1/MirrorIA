# 🤖 Microservicio Machine Learning — MirrorIA (`mirroria-ml`)

Microservicio analítico desacoplado para **Fase 6: Machine Learning Orientado a KPIs de Negocio** en la plataforma SaaS MirrorIA.
Construido con **Python 3.12 + FastAPI + scikit-learn + pandas + numpy + joblib**.

---

## 🏗️ Árbol de Carpetas

```text
mirroria-ml/
├── app/
│   ├── __init__.py
│   ├── main.py             # FastAPI app con Lifespan context manager y CORS (puerto 8002)
│   ├── model.py            # MLModelManager: carga de artefactos .joblib e inferencia asíncrona con asyncio.to_thread
│   └── schemas.py          # Esquemas Pydantic v2 para requests y responses tipadas
├── dataset/
│   ├── __init__.py
│   └── generator.py        # Generador determinista sintético con seed=42 (N=10.000)
├── models/
│   ├── anomalias_iforest.joblib
│   ├── demanda_rf.joblib
│   ├── noshow_logreg.joblib
│   ├── rfm_kmeans.joblib
│   ├── rfm_scaler.joblib
│   └── metrics.json        # MAE, RMSE, R2, ROC-AUC, F1, Silueta, Contaminación y citas canónicas
├── scripts/
│   ├── __init__.py
│   └── train.py            # Script ejecutable de entrenamiento reproducible
├── tests/
│   ├── __init__.py
│   └── test_api.py         # Pytest verificando los 5 endpoints + healthcheck
├── Dockerfile              # python:3.12-slim, non-root user (appuser:10001), EXPOSE 8002
├── .dockerignore
├── pyproject.toml
└── requirements.txt
```

---

## 🎯 Modelos y Vinculación a KPIs de Negocio

| # | Modelo | Algoritmo | Target | KPI Primario | KPI Secundario | Cita Académica |
|---|---|---|---|---|---|---|
| **M1** | Demanda Prendas | `RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)` | Unidades demandadas a 30 días | **Stockout Rate (↓)**: Reducir quiebres de percha de 18.4% a < 5% | **Rotación de Inventario (↑)** con reabastecimiento buffer 20% | Breiman, L. (2001) |
| **M2** | No-Show Reservas | `LogisticRegression(class_weight='balanced', random_state=42)` | Probabilidad inasistencia $P \in [0, 1]$ | **Tasa de No-Show (↓)**: Disminuir inasistencia de 24.5% a < 10% | **Conversión Probador a Venta (↑)** con semáforo y alerta WhatsApp | Cox, D. R. (1958) |
| **M3** | Segmentación RFM | `KMeans(n_clusters=4)` + `StandardScaler` | 4 Clusters (VIP, Potencial, En Riesgo, Ocasional) | **Retención de Clientas (CRR ↑)** | **Customer Lifetime Value (CLV ↑)** | MacQueen, J. (1967) |
| **M4** | Detección Anomalías | `IsolationForest(contamination=0.03, random_state=42)` | Score $s(x)$ y flag de irregularidad | **Tasa de Merma / Fraude (↓)**: Descuentos abusivos y horarios nocturnos | **Auditoría POS en tiempo real** | Liu, F. T. et al. (2008) |

---

## 📡 Endpoints Expuestos (Puerto 8002)

1. `GET /health`: Estado del servicio y modelos en memoria.
2. `POST /predict/demanda`: Recibe lote de prendas y retorna demanda proyectada + riesgo de quiebre + reposición sugerida.
3. `POST /predict/no-show`: Recibe citas agendadas y retorna probabilidad calibrada + semáforo (Verde, Amarillo, Rojo) + factores de riesgo.
4. `POST /predict/rfm`: Recibe clientas (R, F, M) y retorna cluster asignado + CLV en Bs + estrategia comercial.
5. `POST /predict/anomalias`: Recibe tickets de venta y detecta atipicidad (score < 0 o flag -1).
6. `GET /metrics/evaluacion` (`/metrics`): Retorna ficha científica de evaluación reproducible (`metrics.json`).

---

## ⚡ Comandos Útiles

- **Entrenamiento:** `python scripts/train.py`
- **Pruebas:** `pytest`
- **Servidor:** `uvicorn app.main:app --host 0.0.0.0 --port 8002`
- **Docker Compose:** integrado en `/home/lmc/projects/MirrorIA/docker-compose.yml` (`mirroria_ml`, restart: "no").
