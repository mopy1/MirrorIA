"""
Script ejecutable de entrenamiento offline para los 4 modelos de Machine Learning de MirrorIA.
Genera los artefactos serializados .joblib y metrics.json con semilla determinista seed=42.
"""

from __future__ import annotations
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import IsolationForest, RandomForestRegressor
from sklearn.linear_model import LogisticRegression
from sklearn.cluster import KMeans
from sklearn.metrics import (
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
    roc_auc_score,
    silhouette_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# Agregar raíz de mirroria-ml al sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from dataset.generator import (
    generate_anomalias_dataset,
    generate_demanda_dataset,
    generate_noshow_dataset,
    generate_rfm_dataset,
    RANDOM_SEED,
)

MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)


def train_demanda():
    print("-> Entrenando M1: RandomForestRegressor (Demanda a 30 días)...")
    df = generate_demanda_dataset(n_samples=10_000, seed=RANDOM_SEED)

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
    X = df[feature_cols]
    y = df["demanda_30d"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=RANDOM_SEED
    )

    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        random_state=RANDOM_SEED,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mae = float(mean_absolute_error(y_test, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
    r2 = float(r2_score(y_test, y_pred))

    print(f"   M1 Metricas -> R2: {r2:.4f}, MAE: {mae:.2f}, RMSE: {rmse:.2f}")

    # Guardar modelo
    joblib.dump(model, MODELS_DIR / "demanda_rf.joblib", compress=3)
    joblib.dump(model, MODELS_DIR / "demanda_rf_v1.joblib", compress=3)

    return {
        "tipo": "Supervisado (Regresión)",
        "algoritmo": "RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)",
        "cita_academica": "Breiman, L. (2001). Random Forests. Machine Learning, 45(1), 5-32.",
        "metricas": {
            "r2_score": round(r2, 4),
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
        },
        "kpi_asociado": "Quiebres de Stock (Stockout Rate) y Rotación de Inventario",
    }


def train_noshow():
    print("-> Entrenando M2: LogisticRegression (No-Show en Reservas)...")
    df = generate_noshow_dataset(n_samples=10_000, seed=RANDOM_SEED)

    feature_cols = [
        "dias_anticipacion",
        "hora_cita",
        "dia_semana",
        "prendas_apartadas_count",
        "reservas_previas_total",
        "tasa_asistencia_historica",
        "es_fin_de_semana",
    ]
    X = df[feature_cols]
    y = df["no_show"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=RANDOM_SEED, stratify=y
    )

    model = LogisticRegression(
        C=1.0,
        max_iter=1000,
        class_weight="balanced",
        random_state=RANDOM_SEED,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    roc_auc = float(roc_auc_score(y_test, y_prob))
    f1 = float(f1_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred))
    rec = float(recall_score(y_test, y_pred))
    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = [int(v) for v in cm.ravel()]

    print(f"   M2 Metricas -> ROC-AUC: {roc_auc:.4f}, F1: {f1:.4f}, Prec: {prec:.4f}, Rec: {rec:.4f}")

    joblib.dump(model, MODELS_DIR / "noshow_logreg.joblib", compress=3)
    joblib.dump(model, MODELS_DIR / "noshow_logistic_v1.joblib", compress=3)

    return {
        "tipo": "Supervisado (Clasificación)",
        "algoritmo": "LogisticRegression(penalty='l2', C=1.0, class_weight='balanced', random_state=42)",
        "cita_academica": "Cox, D. R. (1958). The Regression Analysis of Binary Sequences. JRSS-B, 20(2), 215-232.",
        "metricas": {
            "roc_auc": round(roc_auc, 4),
            "f1_score": round(f1, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "matriz_confusion": {
                "tn": tn,
                "fp": fp,
                "fn": fn,
                "tp": tp,
            },
        },
        "kpi_asociado": "Tasa de No-Show y Conversión de Reserva a Venta",
    }


def train_rfm():
    print("-> Entrenando M3: KMeans (Segmentación RFM de Clientas)...")
    df = generate_rfm_dataset(n_samples=1500, seed=RANDOM_SEED)

    feature_cols = ["recency_dias", "frequency_compras", "monetary_cents"]
    X = df[feature_cols].copy()

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    kmeans = KMeans(n_clusters=4, init="k-means++", n_init=10, max_iter=300, random_state=RANDOM_SEED)
    clusters = kmeans.fit_predict(X_scaled)

    sil_score = float(silhouette_score(X_scaled, clusters))
    inertia = float(kmeans.inertia_)

    print(f"   M3 Metricas -> Silueta: {sil_score:.4f}, WCSS (Inercia): {inertia:.2f}")

    joblib.dump(scaler, MODELS_DIR / "rfm_scaler.joblib", compress=3)
    joblib.dump(kmeans, MODELS_DIR / "rfm_kmeans.joblib", compress=3)
    joblib.dump(kmeans, MODELS_DIR / "rfm_kmeans_v1.joblib", compress=3)

    return {
        "tipo": "No Supervisado (Clustering)",
        "algoritmo": "KMeans(n_clusters=4, init='k-means++', random_state=42)",
        "cita_academica": "MacQueen, J. (1967). Some Methods for classification and Analysis of Multivariate Observations. 5th Berkeley Symposium, 1, 281-297.",
        "metricas": {
            "silhouette_score": round(sil_score, 4),
            "inercia_wcss": round(inertia, 2),
        },
        "kpi_asociado": "Tasa de Retención de Clientas y Valor de Vida (CLV)",
    }


def train_anomalias():
    print("-> Entrenando M4: IsolationForest (Transacciones Anómalas)...")
    df = generate_anomalias_dataset(n_samples=10_000, contamination=0.03, seed=RANDOM_SEED)

    feature_cols = [
        "monto_total_cents",
        "cantidad_items",
        "hora_venta",
        "descuento_cents",
        "ratio_descuento",
        "metodo_pago",
    ]
    X = df[feature_cols]

    iforest = IsolationForest(
        n_estimators=100,
        max_samples="auto",
        contamination=0.03,
        random_state=RANDOM_SEED,
        n_jobs=-1,
    )
    iforest.fit(X)

    scores = iforest.decision_function(X)
    preds = iforest.predict(X)  # -1 = anómalo, 1 = normal

    anomalas_count = int(np.sum(preds == -1))
    score_normales = float(np.mean(scores[preds == 1]))
    score_anomalos = float(np.mean(scores[preds == -1]))

    print(f"   M4 Metricas -> Anomalías: {anomalas_count}/{len(df)}, Score Normales: {score_normales:.4f}, Score Anomalías: {score_anomalos:.4f}")

    joblib.dump(iforest, MODELS_DIR / "anomalias_iforest.joblib", compress=3)
    joblib.dump(iforest, MODELS_DIR / "anomalias_iforest_v1.joblib", compress=3)

    return {
        "tipo": "No Supervisado (Detección de Anomalías)",
        "algoritmo": "IsolationForest(contamination=0.03, n_estimators=100, random_state=42)",
        "cita_academica": "Liu, F. T., Ting, K. M., & Zhou, Z.-H. (2008). Isolation Forest. IEEE ICDM, 413-422.",
        "metricas": {
            "tasa_contaminacion_esperada": 0.03,
            "anomalias_identificadas_test": anomalas_count,
            "score_medio_normales": round(score_normales, 4),
            "score_medio_anomalos": round(score_anomalos, 4),
        },
        "kpi_asociado": "Reducción de Merma, Fraude y Errores en Ventas Atípicas",
    }


def main():
    print("================================================================")
    print("🚀 INICIANDO ENTRENAMIENTO CIENTÍFICO DE MODELOS ML (MIRRORIA)  ")
    print(f"   Semilla determinista: {RANDOM_SEED} | Dataset size: 10.000")
    print("================================================================")

    m1 = train_demanda()
    m2 = train_noshow()
    m3 = train_rfm()
    m4 = train_anomalias()

    metrics_payload = {
        "fecha_evaluacion": datetime.now(timezone.utc).isoformat(),
        "semilla_reproducible": RANDOM_SEED,
        "dataset_size_total": 10_000,
        "modelos": {
            "M1_demanda_random_forest": m1,
            "M2_noshow_logistic_regression": m2,
            "M3_rfm_kmeans": m3,
            "M4_anomalias_isolation_forest": m4,
        },
    }

    with open(MODELS_DIR / "metrics.json", "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=2, ensure_ascii=False)

    with open(MODELS_DIR / "metricas_evaluacion.json", "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=2, ensure_ascii=False)

    print("\n✅ ENTRENAMIENTO COMPLETADO EXITOSAMENTE!")
    print(f"   Artefactos guardados en: {MODELS_DIR}")
    for file in sorted(os.listdir(MODELS_DIR)):
        size_kb = os.path.getsize(MODELS_DIR / file) / 1024
        print(f"   - {file} ({size_kb:.1f} KB)")


if __name__ == "__main__":
    main()
