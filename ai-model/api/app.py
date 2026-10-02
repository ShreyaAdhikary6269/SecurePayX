"""
app.py
------
Small Flask API that loads the trained fraud models and exposes
one prediction endpoint per payment type. The Node.js backend calls
this service internally - it is never called directly by the browser.

Run with: python api/app.py
Runs on port 8000 by default.
"""

import os
import sys
import pickle

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, request, jsonify
import pandas as pd

from src import config

app = Flask(__name__)

# Tuned thresholds - update creditcard's value if you re-ran threshold_tuning.py
OPTIMAL_THRESHOLDS = {
    "creditcard": 0.9634,
    "paysim": 0.5,
    "banksim": 0.5,
}

_cache = {}


def load_artifacts(dataset_name):
    """Loads and caches a dataset's model + scaler so they're only read from disk once."""
    if dataset_name not in _cache:
        model_paths = config.get_model_paths(dataset_name)
        with open(model_paths["xgboost"], "rb") as f:
            model = pickle.load(f)
        with open(model_paths["scaler"], "rb") as f:
            scaler = pickle.load(f)
        _cache[dataset_name] = (model, scaler)
    return _cache[dataset_name]


def build_creditcard_row(payload, scaler):
    """
    Builds a single-row DataFrame for the credit card model.
    V1-V28 default to 0 since the frontend form doesn't collect them
    (they're anonymized PCA features with no real-world meaning to type in).
    """
    row = {f"V{i}": 0.0 for i in range(1, 29)}
    row["Amount"] = float(payload.get("Amount", 0))
    row["Time"] = float(payload.get("Time", 0))
    df = pd.DataFrame([row])
    df[["Amount", "Time"]] = scaler.transform(df[["Amount", "Time"]])
    return df


def build_paysim_row(payload, scaler, model):
    row = {
        "step": float(payload.get("step", 1)),
        "amount": float(payload.get("amount", 0)),
        "oldbalanceOrg": float(payload.get("oldbalanceOrg", 0)),
        "newbalanceOrig": float(payload.get("newbalanceOrig", 0)),
        "oldbalanceDest": float(payload.get("oldbalanceDest", 0)),
        "newbalanceDest": float(payload.get("newbalanceDest", 0)),
    }
    for t in ["CASH_IN", "CASH_OUT", "DEBIT", "PAYMENT", "TRANSFER"]:
        row[f"type_{t}"] = 1 if payload.get("type") == t else 0

    df = pd.DataFrame([row])
    numeric_cols = ["step", "amount", "oldbalanceOrg", "newbalanceOrig", "oldbalanceDest", "newbalanceDest"]
    df[numeric_cols] = scaler.transform(df[numeric_cols])

    # Align columns to exactly what the model was trained on, in the right order
    expected_cols = model.get_booster().feature_names
    df = df.reindex(columns=expected_cols, fill_value=0)
    return df


def build_banksim_row(payload, scaler, model):
    row = {
        "step": 1.0,
        "age": float(payload.get("age", 0)),
        "amount": float(payload.get("amount", 0)),
    }
    df = pd.DataFrame([row])
    df[["step", "age", "amount"]] = scaler.transform(df[["step", "age", "amount"]])

    expected_cols = model.get_booster().feature_names
    df = df.reindex(columns=expected_cols, fill_value=0)

    gender_col = f"gender_{payload.get('gender', 'M')}"
    if gender_col in df.columns:
        df[gender_col] = 1

    category_col = f"category_{payload.get('category', '')}"
    if category_col in df.columns:
        df[category_col] = 1

    return df


@app.route("/predict/<dataset_name>", methods=["POST"])
def predict(dataset_name):
    if dataset_name not in config.PAYMENT_TYPE_REGISTRY:
        return jsonify({"error": f"Unknown payment type '{dataset_name}'"}), 400

    payload = request.get_json(force=True) or {}

    try:
        model, scaler = load_artifacts(dataset_name)
    except FileNotFoundError:
        return jsonify({
            "error": f"Model for '{dataset_name}' has not been trained yet. Run main.py first."
        }), 500

    try:
        if dataset_name == "creditcard":
            df = build_creditcard_row(payload, scaler)
        elif dataset_name == "paysim":
            df = build_paysim_row(payload, scaler, model)
        elif dataset_name == "banksim":
            df = build_banksim_row(payload, scaler, model)
        else:
            return jsonify({"error": f"No input builder for '{dataset_name}'"}), 500
    except Exception as e:
        return jsonify({"error": f"Bad input: {str(e)}"}), 400

    threshold = OPTIMAL_THRESHOLDS.get(dataset_name, config.DEFAULT_THRESHOLD)
    fraud_probability = float(model.predict_proba(df)[0, 1])
    is_fraud = bool(fraud_probability >= threshold)

    return jsonify({
        "is_fraud": is_fraud,
        "fraud_probability": fraud_probability,
        "threshold_used": threshold,
        "payment_type": dataset_name,
    })


@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "AI model service running", "active_datasets": config.ACTIVE_DATASETS})


if __name__ == "__main__":
    app.run(port=8000, debug=True)