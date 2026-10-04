"""
export_metrics.py
-----------------
Evaluates every trained model and saves the results to
outputs/metrics_summary.json, which the admin dashboard reads.

Metrics use the threshold the app really uses:
  - calibrated model  -> calibrated threshold, measured on the half of the
                         test set that was NOT used to fit the calibrator
  - uncalibrated model -> fallback threshold, measured on the full test set

Run from the ai-model folder:   python export_metrics.py
"""

import os
import json
import pickle
from datetime import datetime, timezone

import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    average_precision_score,
    roc_auc_score,
    confusion_matrix,
)

from src import config
from src.calibration import load_calibration, apply_calibration
from src.predict import OPTIMAL_THRESHOLDS

LABELS = {
    "creditcard": "Credit / debit card",
    "paysim": "Mobile wallet / UPI",
    "banksim": "Banking",
}


def iso_from_file(path):
    return datetime.fromtimestamp(os.path.getmtime(path), tz=timezone.utc).isoformat()


def evaluate_dataset(name):
    model_paths = config.get_model_paths(name)
    processed = config.get_processed_paths(name)

    if not os.path.exists(model_paths["xgboost"]):
        return {"available": False, "label": LABELS.get(name, name), "reason": "Model has not been trained yet"}
    if not (os.path.exists(processed["X_test"]) and os.path.exists(processed["y_test"])):
        return {"available": False, "label": LABELS.get(name, name), "reason": "Saved test set not found"}

    with open(model_paths["xgboost"], "rb") as f:
        model = pickle.load(f)
    with open(processed["X_test"], "rb") as f:
        X_test = pickle.load(f)
    with open(processed["y_test"], "rb") as f:
        y_test = pickle.load(f)

    X = X_test.reset_index(drop=True)
    y = np.asarray(y_test).astype(int)
    raw = model.predict_proba(X)[:, 1]

    calibration = load_calibration(name)
    if calibration is not None:
        calibrator, threshold = calibration
        probs = apply_calibration(calibrator, raw)
        # Same split as calibrate_model.py, so we measure on the unseen half
        idx = np.arange(len(y))
        _, eval_idx = train_test_split(idx, test_size=0.5, stratify=y, random_state=config.RANDOM_STATE)
        y_eval, p_eval = y[eval_idx], probs[eval_idx]
        evaluated_on = "held-out 50% of the test set (the other 50% was used to calibrate)"
    else:
        threshold = OPTIMAL_THRESHOLDS.get(name, config.DEFAULT_THRESHOLD)
        y_eval, p_eval = y, raw
        evaluated_on = "full test set (model is not calibrated)"

    pred = p_eval >= threshold
    tn, fp, fn, tp = confusion_matrix(y_eval, pred, labels=[0, 1]).ravel()

    try:
        names = model.get_booster().feature_names or list(X.columns)
        ranked = sorted(zip(names, model.feature_importances_), key=lambda pair: pair[1], reverse=True)[:8]
        top_features = [{"feature": str(n), "importance": round(float(v), 4)} for n, v in ranked]
    except Exception:
        top_features = []

    return {
        "available": True,
        "label": LABELS.get(name, name),
        "model": "XGBoost",
        "calibrated": calibration is not None,
        "threshold": round(float(threshold), 4),
        "evaluated_on": evaluated_on,
        "test_rows": int(len(y_eval)),
        "test_frauds": int(y_eval.sum()),
        "precision": round(float(precision_score(y_eval, pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_eval, pred, zero_division=0)), 4),
        "f1": round(float(f1_score(y_eval, pred, zero_division=0)), 4),
        "pr_auc": round(float(average_precision_score(y_eval, p_eval)), 4),
        "roc_auc": round(float(roc_auc_score(y_eval, p_eval)), 4) if len(set(y_eval)) > 1 else None,
        "confusion_matrix": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
        "top_features": top_features,
        "trained_at": iso_from_file(model_paths["xgboost"]),
    }


summary = {
    "generated_at": datetime.now(timezone.utc).isoformat(),
    "models": {name: evaluate_dataset(name) for name in config.ACTIVE_DATASETS},
}

os.makedirs(config.OUTPUTS_DIR, exist_ok=True)
out_path = os.path.join(config.OUTPUTS_DIR, "metrics_summary.json")
with open(out_path, "w") as f:
    json.dump(summary, f, indent=2)

print(f"Saved metrics to: {out_path}\n")
for name, info in summary["models"].items():
    if not info["available"]:
        print(f"{name:<11} not available: {info['reason']}")
        continue
    print(
        f"{name:<11} threshold={info['threshold']:<7} precision={info['precision']:<7} "
        f"recall={info['recall']:<7} F1={info['f1']:<7} PR-AUC={info['pr_auc']:<7} "
        f"calibrated={info['calibrated']}"
    )